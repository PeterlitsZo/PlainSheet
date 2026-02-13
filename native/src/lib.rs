#![deny(clippy::all)]

use napi::bindgen_prelude::Buffer;
use napi::{Error, Result, Status};
use napi_derive::napi;
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{LazyLock, Mutex};
use time::{OffsetDateTime, UtcOffset};
use typst::diag::{FileError, FileResult, Severity, SourceDiagnostic};
use typst::foundations::Bytes;
use typst::layout::{Abs, PagedDocument};
use typst::syntax::{FileId, Source, Span, VirtualPath};
use typst::text::{Font, FontBook};
use typst::utils::LazyHash;
use typst::{Library, World};
use typst_kit::download::{Downloader, ProgressSink};
use typst_kit::fonts::{FontSearcher, FontSlot, Fonts};
use typst_kit::package::PackageStorage;
use typst_render::render_merged;

static LIBRARY: LazyLock<LazyHash<Library>> =
    LazyLock::new(|| LazyHash::new(Library::builder().build()));
static FONTS: LazyLock<Fonts> = LazyLock::new(|| FontSearcher::new().search());

#[napi]
pub fn plus_100(input: u32) -> u32 {
    input + 100
}

#[napi(object)]
pub struct RenderOptions {
    pub root_dir: Option<String>,
}

#[napi(object)]
pub struct RenderPngOptions {
    pub root_dir: Option<String>,
    pub pixel_per_pt: Option<f64>,
}

struct TypstWorld {
    root: PathBuf,
    main: FileId,
    main_source: Source,
    book: LazyHash<FontBook>,
    fonts: &'static [FontSlot],
    package_storage: PackageStorage,
    source_cache: Mutex<HashMap<FileId, FileResult<Source>>>,
    file_cache: Mutex<HashMap<FileId, FileResult<Bytes>>>,
}

impl TypstWorld {
    fn new(source: String, root: PathBuf) -> Self {
        let main = FileId::new(None, VirtualPath::new("/main.typ"));
        let main_source = Source::new(main, source);
        let fonts = &FONTS;
        Self {
            root,
            main,
            main_source,
            book: LazyHash::new(fonts.book.clone()),
            fonts: &fonts.fonts,
            package_storage: PackageStorage::new(None, None, Downloader::new("PlainSheet")),
            source_cache: Mutex::new(HashMap::new()),
            file_cache: Mutex::new(HashMap::new()),
        }
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
            id.vpath().resolve(&self.root).ok_or(FileError::AccessDenied)
        }
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

    fn format_span_location(&self, span: Span) -> Option<String> {
        let id = span.id()?;
        let label = self.format_file_label(id);
        let source = self.source(id).ok()?;
        let range = source.range(span)?;
        let line = source.byte_to_line(range.start)? + 1;
        let column = source.byte_to_column(range.start)? + 1;
        Some(format!("{label}:{line}:{column}"))
    }
}

impl World for TypstWorld {
    fn library(&self) -> &LazyHash<Library> {
        &LIBRARY
    }

    fn book(&self) -> &LazyHash<FontBook> {
        &self.book
    }

    fn main(&self) -> FileId {
        self.main
    }

    fn source(&self, id: FileId) -> FileResult<Source> {
        if id == self.main {
            return Ok(self.main_source.clone());
        }

        if let Some(cached) = self.source_cache.lock().unwrap().get(&id).cloned() {
            return cached;
        }

        let result = self
            .resolve_path(id)
            .and_then(|path| self.load_source(id, &path));
        self.source_cache.lock().unwrap().insert(id, result.clone());
        result
    }

    fn file(&self, id: FileId) -> FileResult<Bytes> {
        if let Some(cached) = self.file_cache.lock().unwrap().get(&id).cloned() {
            return cached;
        }

        let result = self
            .resolve_path(id)
            .and_then(|path| self.load_file(&path));
        self.file_cache.lock().unwrap().insert(id, result.clone());
        result
    }

    fn font(&self, index: usize) -> Option<Font> {
        self.fonts.get(index).and_then(FontSlot::get)
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

fn format_diagnostics(world: &TypstWorld, diagnostics: &[SourceDiagnostic]) -> String {
    let mut out = String::new();
    for diagnostic in diagnostics {
        if !out.is_empty() {
            out.push('\n');
        }

        let severity = match diagnostic.severity {
            Severity::Error => "error",
            Severity::Warning => "warning",
        };

        out.push_str(severity);
        out.push_str(": ");
        out.push_str(diagnostic.message.as_str());

        if let Some(location) = world.format_span_location(diagnostic.span) {
            out.push_str(" (at ");
            out.push_str(&location);
            out.push(')');
        }

        for hint in diagnostic.hints.iter() {
            out.push_str("\n  hint: ");
            out.push_str(hint.as_str());
        }
    }

    out
}

fn resolve_root_dir(root_dir: Option<String>) -> PathBuf {
    root_dir
        .map(PathBuf::from)
        .unwrap_or_else(|| std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")))
}

fn compile_paged_document(source: String, root_dir: PathBuf) -> Result<(TypstWorld, PagedDocument)> {
    let world = TypstWorld::new(source, root_dir);
    let warned = typst::compile::<PagedDocument>(&world);

    if !warned.warnings.is_empty() {
        eprintln!("{}", format_diagnostics(&world, &warned.warnings));
    }

    let document = warned.output.map_err(|errors| {
        Error::new(Status::GenericFailure, format_diagnostics(&world, &errors))
    })?;

    Ok((world, document))
}

#[napi]
pub fn render_typst_svg(source: String, options: Option<RenderOptions>) -> Result<String> {
    let root_dir = resolve_root_dir(options.and_then(|options| options.root_dir));
    let (_world, document) = compile_paged_document(source, root_dir)?;
    Ok(typst_svg::svg_merged(&document, Abs::zero()))
}

#[napi]
pub fn render_typst_png(source: String, options: Option<RenderPngOptions>) -> Result<Buffer> {
    let (root_dir, pixel_per_pt) = match options {
        Some(options) => (resolve_root_dir(options.root_dir), options.pixel_per_pt),
        None => (resolve_root_dir(None), None),
    };

    let pixel_per_pt = pixel_per_pt.unwrap_or(2.0);
    if !pixel_per_pt.is_finite() || pixel_per_pt <= 0.0 {
        return Err(Error::new(
            Status::InvalidArg,
            "pixelPerPt must be a positive number.".to_string(),
        ));
    }

    let (_world, document) = compile_paged_document(source, root_dir)?;
    let pixmap = render_merged(&document, pixel_per_pt as f32, Abs::zero(), None);
    let png = pixmap.encode_png().map_err(|err| {
        Error::new(
            Status::GenericFailure,
            format!("Failed to encode PNG: {err}"),
        )
    })?;
    Ok(png.into())
}
