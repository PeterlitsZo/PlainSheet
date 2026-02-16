use indoc::indoc;
use napi::Result;
use rusqlite::{Connection, Transaction};

use super::{map_sqlite_error, napi_error};

const SUPPORTED_SCHEMA_VERSION: i64 = 1;
const SQLITE_APPLICATION_ID: i64 = 0x6fae2dab;

pub(super) fn set_initial_application_id(connection: &Connection) -> Result<()> {
    connection
        .execute_batch(&format!(
            "PRAGMA application_id = {SQLITE_APPLICATION_ID};"
        ))
        .map_err(map_sqlite_error)
}

pub(super) fn validate_existing_application_id(connection: &Connection) -> Result<()> {
    let application_id = current_application_id(connection)?;
    if application_id != SQLITE_APPLICATION_ID {
        return Err(napi_error(format!(
            "SQLite application_id mismatch: expected 0x{SQLITE_APPLICATION_ID:08x}, got 0x{application_id:08x}.",
        )));
    }

    Ok(())
}

pub(super) fn run_migrations(connection: &mut Connection) -> Result<()> {
    let current_version = current_user_version(connection)?;
    validate_or_reject_future_version(current_version)?;

    if current_version == 0 {
        apply_migration_v0_to_v1(connection)?;
    }

    Ok(())
}

fn current_user_version(connection: &Connection) -> Result<i64> {
    connection
        .query_row("PRAGMA user_version", [], |row| row.get::<_, i64>(0))
        .map_err(map_sqlite_error)
}

fn validate_or_reject_future_version(version: i64) -> Result<()> {
    if version < 0 {
        return Err(napi_error(format!(
            "Invalid SQLite schema version {version}."
        )));
    }

    if version > SUPPORTED_SCHEMA_VERSION {
        return Err(napi_error(format!(
            "Database schema version {version} is newer than supported version {SUPPORTED_SCHEMA_VERSION}. Please upgrade PlainSheet.",
        )));
    }

    Ok(())
}

fn current_application_id(connection: &Connection) -> Result<i64> {
    connection
        .query_row("PRAGMA application_id", [], |row| row.get::<_, i64>(0))
        .map_err(map_sqlite_error)
}

fn apply_migration_v0_to_v1(connection: &mut Connection) -> Result<()> {
    let transaction = connection.transaction().map_err(map_sqlite_error)?;

    create_schema_v1(&transaction)?;
    set_user_version(&transaction, 1)?;
    transaction.commit().map_err(map_sqlite_error)?;

    Ok(())
}

fn create_schema_v1(transaction: &Transaction<'_>) -> Result<()> {
    transaction
        .execute_batch(indoc! {"
            CREATE TABLE IF NOT EXISTS workspaces (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                path TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                pinned INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL,
                last_opened_at INTEGER
            );

            CREATE TABLE IF NOT EXISTS workspace_tags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                workspace_id INTEGER NOT NULL,
                tag TEXT NOT NULL,
                UNIQUE (workspace_id, tag),
                FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_workspaces_recent_access
            ON workspaces (last_opened_at DESC, created_at DESC, id DESC);

            CREATE INDEX IF NOT EXISTS idx_workspace_tags_tag
            ON workspace_tags (tag);
        "})
        .map_err(map_sqlite_error)
}

fn set_user_version(transaction: &Transaction<'_>, version: i64) -> Result<()> {
    transaction
        .execute_batch(&format!("PRAGMA user_version = {version};"))
        .map_err(map_sqlite_error)
}
