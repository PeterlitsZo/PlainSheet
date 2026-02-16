use indoc::indoc;
use napi::Result;
use napi_derive::napi;
use rusqlite::{params, Connection, OptionalExtension, Transaction};
use std::collections::HashSet;
use std::path::{Component, Path, PathBuf};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

mod migration;

#[napi(object)]
pub struct WorkspaceRecord {
    pub id: i64,
    pub path: String,
    pub name: String,
    pub pinned: bool,
    pub created_at: i64,
    pub last_opened_at: Option<i64>,
    pub tags: Vec<String>,
    pub exists_on_disk: bool,
}

#[napi(object)]
pub struct CreateWorkspaceInput {
    pub path: String,
    pub name: Option<String>,
    pub pinned: Option<bool>,
    pub tags: Option<Vec<String>>,
    pub last_opened_at: Option<i64>,
}

#[napi(object)]
pub struct UpdateWorkspaceInput {
    pub id: i64,
    pub path: Option<String>,
    pub name: Option<String>,
    pub pinned: Option<bool>,
    pub last_opened_at: Option<i64>,
}

#[napi]
pub struct WorkspaceStore {
    connection: Mutex<Connection>,
}

#[napi]
impl WorkspaceStore {
    #[napi(constructor)]
    pub fn new(db_path: String) -> Result<Self> {
        let database_exists = Path::new(&db_path).exists();
        let mut connection = Connection::open(&db_path)
            .map_err(|error| napi_error(format!("Failed to open SQLite database: {error}")))?;
        connection
            .execute_batch("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;")
            .map_err(|error| napi_error(format!("Failed to initialize SQLite pragmas: {error}")))?;

        if database_exists {
            migration::validate_existing_application_id(&connection)?;
        } else {
            migration::set_initial_application_id(&connection)?;
        }

        migration::run_migrations(&mut connection)?;

        Ok(Self {
            connection: Mutex::new(connection),
        })
    }

    #[napi]
    pub fn list_workspaces(&self) -> Result<Vec<WorkspaceRecord>> {
        self.with_connection(list_workspaces)
    }

    #[napi]
    pub fn create_workspace(&self, input: CreateWorkspaceInput) -> Result<WorkspaceRecord> {
        self.with_connection(|connection| create_workspace(connection, input))
    }

    #[napi]
    pub fn update_workspace(&self, input: UpdateWorkspaceInput) -> Result<WorkspaceRecord> {
        self.with_connection(|connection| update_workspace(connection, input))
    }

    #[napi]
    pub fn remove_workspace(&self, id: i64) -> Result<bool> {
        self.with_connection(|connection| {
            let deleted = connection
                .execute("DELETE FROM workspaces WHERE id = ?1", params![id])
                .map_err(map_sqlite_error)?;

            Ok(deleted > 0)
        })
    }

    #[napi]
    pub fn set_workspace_pinned(&self, id: i64, pinned: bool) -> Result<WorkspaceRecord> {
        self.with_connection(|connection| {
            let updated = connection
                .execute(
                    "UPDATE workspaces SET pinned = ?1 WHERE id = ?2",
                    params![if pinned { 1 } else { 0 }, id],
                )
                .map_err(map_sqlite_error)?;

            if updated == 0 {
                return Err(napi_error(format!("Workspace not found for id: {id}")));
            }

            get_workspace_by_id(connection, id)
        })
    }

    #[napi]
    pub fn set_workspace_tags(&self, id: i64, tags: Vec<String>) -> Result<WorkspaceRecord> {
        self.with_connection(|connection| {
            assert_workspace_exists(connection, id)?;

            let normalized_tags = normalize_tags(tags);
            let transaction = connection.transaction().map_err(map_sqlite_error)?;
            replace_workspace_tags(&transaction, id, &normalized_tags)?;
            transaction.commit().map_err(map_sqlite_error)?;

            get_workspace_by_id(connection, id)
        })
    }
}

impl WorkspaceStore {
    fn with_connection<T>(
        &self,
        operation: impl FnOnce(&mut Connection) -> Result<T>,
    ) -> Result<T> {
        let mut connection = self
            .connection
            .lock()
            .map_err(|_| napi_error("Failed to lock workspace database connection.".to_string()))?;
        operation(&mut connection)
    }
}

fn list_workspaces(connection: &mut Connection) -> Result<Vec<WorkspaceRecord>> {
    let mut statement = connection
        .prepare(indoc! {"
            SELECT id, path, name, pinned, created_at, last_opened_at
            FROM workspaces
            ORDER BY COALESCE(last_opened_at, created_at) DESC, created_at DESC, id DESC
        "})
        .map_err(map_sqlite_error)?;
    let rows = statement
        .query_map([], |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, i64>(3)?,
                row.get::<_, i64>(4)?,
                row.get::<_, Option<i64>>(5)?,
            ))
        })
        .map_err(map_sqlite_error)?;

    let workspace_rows = rows
        .collect::<std::result::Result<Vec<_>, rusqlite::Error>>()
        .map_err(map_sqlite_error)?;

    let mut records = Vec::with_capacity(workspace_rows.len());
    for row in workspace_rows {
        let tags = get_workspace_tags(connection, row.0)?;
        records.push(WorkspaceRecord {
            id: row.0,
            path: row.1.clone(),
            name: row.2,
            pinned: row.3 != 0,
            created_at: row.4,
            last_opened_at: row.5,
            tags,
            exists_on_disk: Path::new(&row.1).exists(),
        });
    }

    Ok(records)
}

fn create_workspace(
    connection: &mut Connection,
    input: CreateWorkspaceInput,
) -> Result<WorkspaceRecord> {
    let normalized_path = normalize_workspace_path(&input.path)?;
    let name = normalize_workspace_name(input.name, &normalized_path);
    let pinned = input.pinned.unwrap_or(false);
    let created_at = current_timestamp_millis()?;
    let tags = normalize_tags(input.tags.unwrap_or_default());

    connection
        .execute(
            indoc! {"
                INSERT INTO workspaces (
                    path,
                    name,
                    pinned,
                    created_at,
                    last_opened_at
                ) VALUES (?1, ?2, ?3, ?4, ?5)
            "},
            params![
                normalized_path,
                name,
                if pinned { 1 } else { 0 },
                created_at,
                input.last_opened_at,
            ],
        )
        .map_err(map_path_unique_error)?;

    let workspace_id = connection.last_insert_rowid();
    if !tags.is_empty() {
        let transaction = connection.transaction().map_err(map_sqlite_error)?;
        replace_workspace_tags(&transaction, workspace_id, &tags)?;
        transaction.commit().map_err(map_sqlite_error)?;
    }

    get_workspace_by_id(connection, workspace_id)
}

fn update_workspace(
    connection: &mut Connection,
    input: UpdateWorkspaceInput,
) -> Result<WorkspaceRecord> {
    let existing = get_workspace_by_id(connection, input.id)?;

    let updated_path = match input.path {
        Some(path) => normalize_workspace_path(&path)?,
        None => existing.path,
    };
    let updated_name = normalize_workspace_name(input.name, &updated_path);
    let updated_pinned = input.pinned.unwrap_or(existing.pinned);
    let updated_last_opened_at = input.last_opened_at.or(existing.last_opened_at);

    connection
        .execute(
            indoc! {"
                UPDATE workspaces
                SET path = ?1,
                    name = ?2,
                    pinned = ?3,
                    last_opened_at = ?4
                WHERE id = ?5
            "},
            params![
                updated_path,
                updated_name,
                if updated_pinned { 1 } else { 0 },
                updated_last_opened_at,
                input.id,
            ],
        )
        .map_err(map_path_unique_error)?;

    get_workspace_by_id(connection, input.id)
}

fn get_workspace_by_id(connection: &Connection, id: i64) -> Result<WorkspaceRecord> {
    let workspace = connection
        .query_row(
            indoc! {"
                SELECT id, path, name, pinned, created_at, last_opened_at
                FROM workspaces
                WHERE id = ?1
            "},
            params![id],
            |row| {
                Ok((
                    row.get::<_, i64>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, i64>(3)?,
                    row.get::<_, i64>(4)?,
                    row.get::<_, Option<i64>>(5)?,
                ))
            },
        )
        .optional()
        .map_err(map_sqlite_error)?;

    let Some((workspace_id, path, name, pinned, created_at, last_opened_at)) = workspace else {
        return Err(napi_error(format!("Workspace not found for id: {id}")));
    };

    let tags = get_workspace_tags(connection, workspace_id)?;
    Ok(WorkspaceRecord {
        id: workspace_id,
        path: path.clone(),
        name,
        pinned: pinned != 0,
        created_at,
        last_opened_at,
        tags,
        exists_on_disk: Path::new(&path).exists(),
    })
}

fn assert_workspace_exists(connection: &Connection, id: i64) -> Result<()> {
    let exists = connection
        .query_row(
            "SELECT 1 FROM workspaces WHERE id = ?1",
            params![id],
            |_| Ok(()),
        )
        .optional()
        .map_err(map_sqlite_error)?;

    if exists.is_none() {
        return Err(napi_error(format!("Workspace not found for id: {id}")));
    }

    Ok(())
}

fn replace_workspace_tags(
    transaction: &Transaction<'_>,
    workspace_id: i64,
    tags: &[String],
) -> Result<()> {
    transaction
        .execute(
            "DELETE FROM workspace_tags WHERE workspace_id = ?1",
            params![workspace_id],
        )
        .map_err(map_sqlite_error)?;

    for tag in tags {
        transaction
            .execute(
                "INSERT INTO workspace_tags (workspace_id, tag) VALUES (?1, ?2)",
                params![workspace_id, tag],
            )
            .map_err(map_sqlite_error)?;
    }

    Ok(())
}

fn get_workspace_tags(connection: &Connection, workspace_id: i64) -> Result<Vec<String>> {
    let mut statement = connection
        .prepare("SELECT tag FROM workspace_tags WHERE workspace_id = ?1 ORDER BY tag ASC")
        .map_err(map_sqlite_error)?;
    let tags = statement
        .query_map(params![workspace_id], |row| row.get::<_, String>(0))
        .map_err(map_sqlite_error)?;

    tags.collect::<std::result::Result<Vec<String>, rusqlite::Error>>()
        .map_err(map_sqlite_error)
}

pub(super) fn normalize_workspace_path(value: &str) -> Result<String> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return Err(napi_error("Workspace path cannot be empty.".to_string()));
    }

    let path = PathBuf::from(trimmed);
    let absolute = if path.is_absolute() {
        path
    } else {
        std::env::current_dir()
            .map_err(|error| napi_error(format!("Failed to resolve current directory: {error}")))?
            .join(path)
    };

    let mut normalized = PathBuf::new();
    for component in absolute.components() {
        match component {
            Component::Prefix(prefix) => normalized.push(prefix.as_os_str()),
            Component::RootDir => normalized.push(component.as_os_str()),
            Component::CurDir => {}
            Component::ParentDir => {
                if !normalized.pop() {
                    normalized.push(component.as_os_str());
                }
            }
            Component::Normal(part) => normalized.push(part),
        }
    }

    let mut normalized_string = normalized.to_string_lossy().to_string();
    if cfg!(windows) {
        normalized_string = normalized_string.to_lowercase();
    }
    if normalized_string.is_empty() {
        return Err(napi_error(
            "Workspace path normalization failed.".to_string(),
        ));
    }

    Ok(normalized_string)
}

fn normalize_workspace_name(name: Option<String>, path: &str) -> String {
    if let Some(value) = name {
        let trimmed = value.trim();
        if !trimmed.is_empty() {
            return trimmed.to_string();
        }
    }

    default_workspace_name(path)
}

pub(super) fn default_workspace_name(path: &str) -> String {
    Path::new(path)
        .file_name()
        .and_then(|part| part.to_str())
        .filter(|value| !value.trim().is_empty())
        .map(std::string::ToString::to_string)
        .unwrap_or_else(|| path.to_string())
}

fn normalize_tags(tags: Vec<String>) -> Vec<String> {
    let mut seen = HashSet::new();
    let mut normalized = Vec::new();

    for tag in tags {
        let trimmed = tag.trim();
        if trimmed.is_empty() {
            continue;
        }
        let candidate = trimmed.to_string();
        if seen.insert(candidate.clone()) {
            normalized.push(candidate);
        }
    }

    normalized
}

pub(super) fn current_timestamp_millis() -> Result<i64> {
    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|error| napi_error(format!("System clock is before UNIX_EPOCH: {error}")))?;
    Ok(duration.as_millis() as i64)
}

fn map_path_unique_error(error: rusqlite::Error) -> napi::Error {
    match &error {
        rusqlite::Error::SqliteFailure(inner, _) => {
            if inner.code == rusqlite::ErrorCode::ConstraintViolation {
                return napi_error("Workspace path already exists.".to_string());
            }
        }
        _ => {}
    }

    map_sqlite_error(error)
}

pub(super) fn map_sqlite_error(error: rusqlite::Error) -> napi::Error {
    napi_error(format!("SQLite error: {error}"))
}

pub(super) fn napi_error(message: String) -> napi::Error {
    napi::Error::new(napi::Status::GenericFailure, message)
}
