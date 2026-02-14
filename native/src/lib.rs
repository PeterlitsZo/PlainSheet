#![deny(clippy::all)]

mod render_session;
mod typst_world;
mod utils;

use napi::bindgen_prelude::Buffer;
use napi::Result;
use napi_derive::napi;
use render_session::RenderSession;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use typst::utils::LazyHash;
use typst::Library;
use typst_kit::fonts::{FontSearcher, Fonts};
use typst_render::render_merged;
use typst_world::TypstWorld;

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

#[napi]
pub struct TypstRenderer {
    engine: Mutex<RenderEngine>,
}

struct RenderEngine {
    library: Arc<LazyHash<Library>>,
    fonts: Arc<Fonts>,
    session: Option<RenderSession>,
}

impl RenderEngine {
    fn new() -> Self {
        Self {
            library: Arc::new(LazyHash::new(Library::builder().build())),
            fonts: Arc::new(FontSearcher::new().search()),
            session: None,
        }
    }

    fn world_for_source(&mut self, source: String, root_dir: PathBuf) -> &TypstWorld {
        let should_reuse = self
            .session
            .as_ref()
            .is_some_and(|session| session.reuse_for(root_dir.as_path()));

        if should_reuse {
            let session = self.session.as_ref().unwrap();
            session.update_source(&source);
            return session.world();
        }

        self.session = Some(RenderSession::new(
            source,
            root_dir,
            Arc::clone(&self.library),
            Arc::clone(&self.fonts),
        ));

        self.session.as_ref().unwrap().world()
    }
}

#[napi]
impl TypstRenderer {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self {
            engine: Mutex::new(RenderEngine::new()),
        }
    }

    #[napi]
    pub fn render_typst_svg(
        &self,
        source: String,
        options: Option<RenderOptions>,
    ) -> Result<String> {
        let root_dir = utils::resolve_root_dir(options.and_then(|options| options.root_dir));
        self.with_world(source, root_dir, |world| {
            let document = utils::compile_paged_document(world)?;
            Ok(typst_svg::svg_merged(&document, typst::layout::Abs::zero()))
        })
    }

    #[napi]
    pub fn render_typst_png(
        &self,
        source: String,
        options: Option<RenderPngOptions>,
    ) -> Result<Buffer> {
        let (root_dir, pixel_per_pt) = match options {
            Some(options) => (
                utils::resolve_root_dir(options.root_dir),
                options.pixel_per_pt,
            ),
            None => (utils::resolve_root_dir(None), None),
        };

        let pixel_per_pt = utils::resolve_pixel_per_pt(pixel_per_pt)?;

        self.with_world(source, root_dir, |world| {
            let document = utils::compile_paged_document(world)?;
            let pixmap = render_merged(
                &document,
                pixel_per_pt as f32,
                typst::layout::Abs::zero(),
                None,
            );
            let png = pixmap.encode_png().map_err(|err| {
                napi::Error::new(
                    napi::Status::GenericFailure,
                    format!("Failed to encode PNG: {err}"),
                )
            })?;
            Ok(png.into())
        })
    }

    fn with_world<T>(
        &self,
        source: String,
        root_dir: PathBuf,
        render: impl FnOnce(&TypstWorld) -> Result<T>,
    ) -> Result<T> {
        let mut engine = self.engine.lock().unwrap();
        let world = engine.world_for_source(source, root_dir);
        render(world)
    }
}
