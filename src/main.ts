import path from "node:path";
import { app, BrowserWindow, dialog, ipcMain } from "electron";
import started from "electron-squirrel-startup";
import {
  type CreateWorkspaceInput,
  loadNative,
  type NativeModule,
  type UpdateWorkspaceInput,
} from "./main/native";
import { registerTypstProtocol, storeTypstPreview } from "./main/protocol";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

const ensureObject = (
  value: unknown,
  fieldName: string,
): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${fieldName} must be an object.`);
  }

  return value as Record<string, unknown>;
};

const ensureNonEmptyString = (value: unknown, fieldName: string): string => {
  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a string.`);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${fieldName} cannot be empty.`);
  }

  return trimmed;
};

const ensureIntegerId = (value: unknown, fieldName: string): number => {
  if (!Number.isInteger(value) || (value as number) <= 0) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }

  return value as number;
};

const ensureOptionalTimestamp = (
  value: unknown,
  fieldName: string,
): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (!Number.isInteger(value) || (value as number) < 0) {
    throw new Error(`${fieldName} must be a non-negative integer timestamp.`);
  }

  return value as number;
};

const normalizeTags = (value: unknown, fieldName: string): string[] => {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array of strings.`);
  }

  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") {
      throw new Error(`${fieldName} must be an array of strings.`);
    }

    const trimmed = item.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    result.push(trimmed);
  }

  return result;
};

const parseCreateWorkspaceInput = (value: unknown): CreateWorkspaceInput => {
  const input = ensureObject(value, "createWorkspace input");
  const path = ensureNonEmptyString(input.path, "createWorkspace.path");

  const parsed: CreateWorkspaceInput = { path };
  if (input.name !== undefined) {
    parsed.name = ensureNonEmptyString(input.name, "createWorkspace.name");
  }
  if (input.pinned !== undefined) {
    if (typeof input.pinned !== "boolean") {
      throw new Error("createWorkspace.pinned must be a boolean.");
    }
    parsed.pinned = input.pinned;
  }
  if (input.tags !== undefined) {
    parsed.tags = normalizeTags(input.tags, "createWorkspace.tags");
  }
  if (input.lastOpenedAt !== undefined) {
    parsed.lastOpenedAt = ensureOptionalTimestamp(
      input.lastOpenedAt,
      "createWorkspace.lastOpenedAt",
    );
  }

  return parsed;
};

const parseUpdateWorkspaceInput = (value: unknown): UpdateWorkspaceInput => {
  const input = ensureObject(value, "updateWorkspace input");
  const id = ensureIntegerId(input.id, "updateWorkspace.id");

  const parsed: UpdateWorkspaceInput = { id };
  let updated = false;

  if (input.path !== undefined) {
    parsed.path = ensureNonEmptyString(input.path, "updateWorkspace.path");
    updated = true;
  }

  if (input.name !== undefined) {
    parsed.name = ensureNonEmptyString(input.name, "updateWorkspace.name");
    updated = true;
  }

  if (input.pinned !== undefined) {
    if (typeof input.pinned !== "boolean") {
      throw new Error("updateWorkspace.pinned must be a boolean.");
    }
    parsed.pinned = input.pinned;
    updated = true;
  }

  if (input.lastOpenedAt !== undefined) {
    parsed.lastOpenedAt = ensureOptionalTimestamp(
      input.lastOpenedAt,
      "updateWorkspace.lastOpenedAt",
    );
    updated = true;
  }

  if (!updated) {
    throw new Error("updateWorkspace requires at least one field to update.");
  }

  return parsed;
};

const registerNativeHandlers = (native: NativeModule) => {
  ipcMain.handle(
    "native:renderTypstPng",
    (_event, source: string, options?: { pixelPerPt?: number }): string => {
      if (typeof source !== "string") {
        throw new Error("Typst source must be a string.");
      }

      const png = native.renderTypstPng(source, {
        rootDir: app.getAppPath(),
        pixelPerPt: options?.pixelPerPt,
      });
      return storeTypstPreview(png);
    },
  );

  ipcMain.handle("native:listWorkspaces", () => native.listWorkspaces());

  ipcMain.handle("native:createWorkspace", (_event, input: unknown) =>
    native.createWorkspace(parseCreateWorkspaceInput(input)),
  );

  ipcMain.handle("native:updateWorkspace", (_event, input: unknown) =>
    native.updateWorkspace(parseUpdateWorkspaceInput(input)),
  );

  ipcMain.handle("native:removeWorkspace", (_event, id: unknown) =>
    native.removeWorkspace(ensureIntegerId(id, "removeWorkspace.id")),
  );

  ipcMain.handle(
    "native:setWorkspacePinned",
    (_event, id: unknown, pinned: unknown) => {
      const workspaceId = ensureIntegerId(id, "setWorkspacePinned.id");
      if (typeof pinned !== "boolean") {
        throw new Error("setWorkspacePinned.pinned must be a boolean.");
      }

      return native.setWorkspacePinned(workspaceId, pinned);
    },
  );

  ipcMain.handle(
    "native:setWorkspaceTags",
    (_event, id: unknown, tags: unknown) =>
      native.setWorkspaceTags(
        ensureIntegerId(id, "setWorkspaceTags.id"),
        normalizeTags(tags, "setWorkspaceTags.tags"),
      ),
  );
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  try {
    const native = loadNative();
    registerNativeHandlers(native);
    registerTypstProtocol();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to load native module:", message);
    dialog.showErrorBox("Native module failed to load", message);
    app.quit();
    return;
  }

  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
