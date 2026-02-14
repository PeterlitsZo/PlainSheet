use crate::typst_world::TypstWorld;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use typst::utils::LazyHash;
use typst::Library;
use typst_kit::fonts::Fonts;

pub struct RenderSession {
    root_dir: PathBuf,
    world: TypstWorld,
}

impl RenderSession {
    pub fn new(
        source: String,
        root_dir: PathBuf,
        library: Arc<LazyHash<Library>>,
        fonts: Arc<Fonts>,
    ) -> Self {
        let world = TypstWorld::new(source, root_dir.clone(), library, fonts);
        Self { root_dir, world }
    }

    pub fn reuse_for(&self, root_dir: &Path) -> bool {
        self.root_dir == root_dir
    }

    pub fn update_source(&self, source: &str) {
        self.world.update_main_source(source);
    }

    pub fn world(&self) -> &TypstWorld {
        &self.world
    }
}
