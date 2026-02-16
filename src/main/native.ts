import fs from "node:fs";
import path from "node:path";
import { app } from "electron";

export type WorkspaceRecord = {
  id: number;
  path: string;
  name: string;
  pinned: boolean;
  createdAt: number;
  lastOpenedAt: number | null;
  tags: string[];
  existsOnDisk: boolean;
};

export type CreateWorkspaceInput = {
  path: string;
  name?: string;
  pinned?: boolean;
  tags?: string[];
  lastOpenedAt?: number;
};

export type UpdateWorkspaceInput = {
  id: number;
  path?: string;
  name?: string;
  pinned?: boolean;
  lastOpenedAt?: number;
};

export type NativeModule = {
  renderTypstPng: (
    source: string,
    options?: { rootDir?: string; pixelPerPt?: number },
  ) => Uint8Array;
  listWorkspaces: () => WorkspaceRecord[];
  createWorkspace: (input: CreateWorkspaceInput) => WorkspaceRecord;
  updateWorkspace: (input: UpdateWorkspaceInput) => WorkspaceRecord;
  removeWorkspace: (id: number) => boolean;
  setWorkspacePinned: (id: number, pinned: boolean) => WorkspaceRecord;
  setWorkspaceTags: (id: number, tags: string[]) => WorkspaceRecord;
};

type NativeRenderer = {
  renderTypstPng: (
    source: string,
    options?: { rootDir?: string; pixelPerPt?: number },
  ) => Uint8Array;
};

type NativeWorkspaceStore = {
  listWorkspaces: () => WorkspaceRecord[];
  createWorkspace: (input: CreateWorkspaceInput) => WorkspaceRecord;
  updateWorkspace: (input: UpdateWorkspaceInput) => WorkspaceRecord;
  removeWorkspace: (id: number) => boolean;
  setWorkspacePinned: (id: number, pinned: boolean) => WorkspaceRecord;
  setWorkspaceTags: (id: number, tags: string[]) => WorkspaceRecord;
};

type NativeBindings = {
  TypstRenderer?: new () => NativeRenderer;
  WorkspaceStore?: new (dbPath: string) => NativeWorkspaceStore;
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
    typeof module.TypstRenderer !== "function" ||
    typeof module.WorkspaceStore !== "function"
  ) {
    return null;
  }

  const renderer = new module.TypstRenderer();
  const dbPath = path.join(app.getPath("userData"), "plainsheet.sqlite3");
  const workspaceStore = new module.WorkspaceStore(dbPath);

  if (typeof renderer.renderTypstPng !== "function") {
    return null;
  }

  if (
    typeof workspaceStore.listWorkspaces !== "function" ||
    typeof workspaceStore.createWorkspace !== "function" ||
    typeof workspaceStore.updateWorkspace !== "function" ||
    typeof workspaceStore.removeWorkspace !== "function" ||
    typeof workspaceStore.setWorkspacePinned !== "function" ||
    typeof workspaceStore.setWorkspaceTags !== "function"
  ) {
    return null;
  }

  return {
    renderTypstPng: (source, options) =>
      renderer.renderTypstPng(source, options),
    listWorkspaces: () => workspaceStore.listWorkspaces(),
    createWorkspace: (input) => workspaceStore.createWorkspace(input),
    updateWorkspace: (input) => workspaceStore.updateWorkspace(input),
    removeWorkspace: (id) => workspaceStore.removeWorkspace(id),
    setWorkspacePinned: (id, pinned) =>
      workspaceStore.setWorkspacePinned(id, pinned),
    setWorkspaceTags: (id, tags) => workspaceStore.setWorkspaceTags(id, tags),
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
