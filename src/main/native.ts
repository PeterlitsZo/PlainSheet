import fs from "node:fs";
import path from "node:path";
import { app } from "electron";

export type NativeModule = {
  plus100: (input: number) => number;
  renderTypstSvg: (source: string, options?: { rootDir?: string }) => string;
  renderTypstPng: (
    source: string,
    options?: { rootDir?: string; pixelPerPt?: number },
  ) => Uint8Array;
};

type NativeRenderer = {
  renderTypstSvg: (source: string, options?: { rootDir?: string }) => string;
  renderTypstPng: (
    source: string,
    options?: { rootDir?: string; pixelPerPt?: number },
  ) => Uint8Array;
};

type NativeBindings = {
  plus100?: (input: number) => number;
  TypstRenderer?: new () => NativeRenderer;
};

const resolveNativeEntry = () => {
  const candidates = [
    path.join(app.getAppPath(), "native", "build", "index.js"),
    path.join(process.cwd(), "native", "build", "index.js"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return candidates[0];
};

const resolveNativeBinary = () => {
  const candidates = [
    path.join(process.resourcesPath, "app.asar.unpacked", "native", "build"),
    path.join(app.getAppPath(), "native", "build"),
    path.join(process.cwd(), "native", "build"),
  ];

  for (const dir of candidates) {
    if (!fs.existsSync(dir)) {
      continue;
    }

    const files = fs
      .readdirSync(dir)
      .filter((entry) => entry.endsWith(".node"));
    if (files.length > 0) {
      return path.join(dir, files[0]);
    }
  }

  return null;
};

const createNativeModule = (module: NativeBindings): NativeModule | null => {
  if (
    typeof module.plus100 !== "function" ||
    typeof module.TypstRenderer !== "function"
  ) {
    return null;
  }

  const renderer = new module.TypstRenderer();
  if (
    typeof renderer.renderTypstSvg !== "function" ||
    typeof renderer.renderTypstPng !== "function"
  ) {
    return null;
  }

  return {
    plus100: module.plus100,
    renderTypstSvg: (source, options) =>
      renderer.renderTypstSvg(source, options),
    renderTypstPng: (source, options) =>
      renderer.renderTypstPng(source, options),
  };
};

export const loadNative = (): NativeModule => {
  const entryPath = resolveNativeEntry();

  if (fs.existsSync(entryPath)) {
    try {
      const module = require(entryPath) as NativeBindings;
      const native = createNativeModule(module);
      if (native) {
        return native;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Failed to load native module at ${entryPath}: ${message}`);
    }
  }

  const binaryPath = resolveNativeBinary();
  if (binaryPath) {
    const module = require(binaryPath) as NativeBindings;
    const native = createNativeModule(module);
    if (native) {
      return native;
    }
  }

  const hint = "Run `(cd native; just build)` to build the Rust module.";
  throw new Error(`Native module not found. ${hint}`);
};
