use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use std::time::SystemTime;
use time::{OffsetDateTime, UtcOffset};
use typst::diag::{FileError, FileResult};
use typst::foundations::Bytes;
use typst::syntax::{FileId, Source, Span, VirtualPath};
use typst::text::{Font, FontBook};
use typst::utils::LazyHash;
use typst::{Library, World};
use typst_kit::download::{Downloader, ProgressSink};
use typst_kit::fonts::{FontSlot, Fonts};
use typst_kit::package::PackageStorage;

pub struct TypstWorld {
    root: PathBuf,
    main: FileId,
    main_source: Mutex<Source>,
    library: Arc<LazyHash<Library>>,
    book: LazyHash<FontBook>,
    fonts: Arc<Fonts>,
    package_storage: PackageStorage,
    source_cache: Mutex<HashMap<FileId, CacheEntry<Source>>>,
    file_cache: Mutex<HashMap<FileId, CacheEntry<Bytes>>>,
}

impl TypstWorld {
    pub fn new(
        source: String,
        root: PathBuf,
        library: Arc<LazyHash<Library>>,
        fonts: Arc<Fonts>,
    ) -> Self {
        let main = FileId::new(None, VirtualPath::new("/main.typ"));
        let main_source = Source::new(main, source);
        Self {
            root,
            main,
            main_source: Mutex::new(main_source),
            library,
            book: LazyHash::new(fonts.book.clone()),
            fonts,
            package_storage: PackageStorage::new(None, None, Downloader::new("PlainSheet")),
            source_cache: Mutex::new(HashMap::new()),
            file_cache: Mutex::new(HashMap::new()),
        }
    }

    pub fn update_main_source(&self, new_source: &str) {
        let mut source = self.main_source.lock().unwrap();
        source.replace(new_source);
    }

    fn resolve_path(&self, id: FileId) -> FileResult<PathBuf> {
        if let Some(package) = id.package() {
            let mut progress = ProgressSink;
            let package_dir = self
                .package_storage
                .prepare_package(package, &mut progress)
                .map_err(FileError::Package)?;
            id.vpath()
                .resolve(&package_dir)
                .ok_or(FileError::AccessDenied)
        } else {
            id.vpath()
                .resolve(&self.root)
                .ok_or(FileError::AccessDenied)
        }
    }

    fn file_stamp(&self, path: &Path) -> FileResult<Option<FileStamp>> {
        let metadata = fs::metadata(path).map_err(|err| FileError::from_io(err, path))?;
        if metadata.is_dir() {
            return Err(FileError::IsDirectory);
        }

        let modified = metadata.modified().ok();
        Ok(modified.map(|modified| FileStamp {
            modified,
            size: metadata.len(),
        }))
    }

    fn load_source(&self, id: FileId, path: &Path) -> FileResult<Source> {
        if path.extension().and_then(|ext| ext.to_str()) != Some("typ") {
            return Err(FileError::NotSource);
        }

        let text = fs::read_to_string(path).map_err(|err| FileError::from_io(err, path))?;
        Ok(Source::new(id, text))
    }

    fn load_file(&self, path: &Path) -> FileResult<Bytes> {
        let metadata = fs::metadata(path).map_err(|err| FileError::from_io(err, path))?;
        if metadata.is_dir() {
            return Err(FileError::IsDirectory);
        }

        let data = fs::read(path).map_err(|err| FileError::from_io(err, path))?;
        Ok(Bytes::new(data))
    }

    pub fn format_span_location(&self, span: Span) -> Option<String> {
        let id = span.id()?;
        let label = self.format_file_label(id);
        let source = self.source(id).ok()?;
        let range = source.range(span)?;
        let line = source.byte_to_line(range.start)? + 1;
        let column = source.byte_to_column(range.start)? + 1;
        Some(format!("{label}:{line}:{column}"))
    }

    fn format_file_label(&self, id: FileId) -> String {
        let vpath = id.vpath().as_rooted_path().display();
        if let Some(package) = id.package() {
            format!("{package}{vpath}")
        } else if let Some(path) = id.vpath().resolve(&self.root) {
            path.display().to_string()
        } else {
            vpath.to_string()
        }
    }
}

impl World for TypstWorld {
    fn library(&self) -> &LazyHash<Library> {
        self.library.as_ref()
    }

    fn book(&self) -> &LazyHash<FontBook> {
        &self.book
    }

    fn main(&self) -> FileId {
        self.main
    }

    fn source(&self, id: FileId) -> FileResult<Source> {
        if id == self.main {
            return Ok(self.main_source.lock().unwrap().clone());
        }

        let path = self.resolve_path(id)?;
        if path.extension().and_then(|ext| ext.to_str()) != Some("typ") {
            return Err(FileError::NotSource);
        }

        let stamp = self.file_stamp(&path)?;
        if let Some(stamp) = stamp.as_ref() {
            if let Some(cached) = self.source_cache.lock().unwrap().get(&id) {
                if cached.matches(stamp) {
                    return Ok(cached.value.clone());
                }
            }
        }

        match self.load_source(id, &path) {
            Ok(source) => {
                if let Some(stamp) = stamp {
                    self.source_cache.lock().unwrap().insert(
                        id,
                        CacheEntry {
                            stamp,
                            value: source.clone(),
                        },
                    );
                }
                Ok(source)
            }
            Err(error) => {
                self.source_cache.lock().unwrap().remove(&id);
                Err(error)
            }
        }
    }

    fn file(&self, id: FileId) -> FileResult<Bytes> {
        let path = self.resolve_path(id)?;
        let stamp = self.file_stamp(&path)?;
        if let Some(stamp) = stamp.as_ref() {
            if let Some(cached) = self.file_cache.lock().unwrap().get(&id) {
                if cached.matches(stamp) {
                    return Ok(cached.value.clone());
                }
            }
        }

        match self.load_file(&path) {
            Ok(bytes) => {
                if let Some(stamp) = stamp {
                    self.file_cache.lock().unwrap().insert(
                        id,
                        CacheEntry {
                            stamp,
                            value: bytes.clone(),
                        },
                    );
                }
                Ok(bytes)
            }
            Err(error) => {
                self.file_cache.lock().unwrap().remove(&id);
                Err(error)
            }
        }
    }

    fn font(&self, index: usize) -> Option<Font> {
        self.fonts.fonts.get(index).and_then(FontSlot::get)
    }

    fn today(&self, offset: Option<i64>) -> Option<typst::foundations::Datetime> {
        let now = match offset {
            Some(hours) => {
                let hours = i8::try_from(hours).ok()?;
                let offset = UtcOffset::from_hms(hours, 0, 0).ok()?;
                OffsetDateTime::now_utc().to_offset(offset)
            }
            None => OffsetDateTime::now_local().ok()?,
        };
        typst::foundations::Datetime::from_ymd(now.year(), now.month() as u8, now.day())
    }
}

#[derive(Clone)]
struct FileStamp {
    modified: SystemTime,
    size: u64,
}

struct CacheEntry<T> {
    stamp: FileStamp,
    value: T,
}

impl<T> CacheEntry<T> {
    fn matches(&self, stamp: &FileStamp) -> bool {
        self.stamp.modified == stamp.modified && self.stamp.size == stamp.size
    }
}
