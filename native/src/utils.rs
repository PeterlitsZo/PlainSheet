use crate::typst_world::TypstWorld;
use napi::{Error, Result, Status};
use std::path::PathBuf;
use typst::diag::{Severity, SourceDiagnostic};
use typst::layout::PagedDocument;

pub fn resolve_root_dir(root_dir: Option<String>) -> PathBuf {
    root_dir
        .map(PathBuf::from)
        .unwrap_or_else(|| std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")))
}

pub fn resolve_pixel_per_pt(pixel_per_pt: Option<f64>) -> Result<f64> {
    let pixel_per_pt = pixel_per_pt.unwrap_or(2.0);
    if !pixel_per_pt.is_finite() || pixel_per_pt <= 0.0 {
        return Err(Error::new(
            Status::InvalidArg,
            "pixelPerPt must be a positive number.".to_string(),
        ));
    }

    Ok(pixel_per_pt)
}

pub fn compile_paged_document(world: &TypstWorld) -> Result<PagedDocument> {
    let warned = typst::compile::<PagedDocument>(world);

    if !warned.warnings.is_empty() {
        eprintln!("{}", format_diagnostics(world, &warned.warnings));
    }

    warned
        .output
        .map_err(|errors| Error::new(Status::GenericFailure, format_diagnostics(world, &errors)))
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
