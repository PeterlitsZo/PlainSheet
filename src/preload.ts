import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("app", {
  renderTypstPng: (
    source: string,
    options?: { pixelPerPt?: number },
  ): Promise<string> =>
    ipcRenderer.invoke("app:renderTypstPng", source, options),
  listWorkspaces: (): Promise<
    {
      id: number;
      path: string;
      name: string;
      pinned: boolean;
      createdAt: number;
      lastOpenedAt: number | null;
      tags: string[];
      existsOnDisk: boolean;
    }[]
  > => ipcRenderer.invoke("app:listWorkspaces"),
  createWorkspace: (input: {
    path: string;
    name?: string;
    pinned?: boolean;
    tags?: string[];
    lastOpenedAt?: number;
  }): Promise<{
    id: number;
    path: string;
    name: string;
    pinned: boolean;
    createdAt: number;
    lastOpenedAt: number | null;
    tags: string[];
    existsOnDisk: boolean;
  }> => ipcRenderer.invoke("app:createWorkspace", input),
  updateWorkspace: (input: {
    id: number;
    path?: string;
    name?: string;
    pinned?: boolean;
    lastOpenedAt?: number;
  }): Promise<{
    id: number;
    path: string;
    name: string;
    pinned: boolean;
    createdAt: number;
    lastOpenedAt: number | null;
    tags: string[];
    existsOnDisk: boolean;
  }> => ipcRenderer.invoke("app:updateWorkspace", input),
  removeWorkspace: (id: number): Promise<boolean> =>
    ipcRenderer.invoke("app:removeWorkspace", id),
  setWorkspacePinned: (
    id: number,
    pinned: boolean,
  ): Promise<{
    id: number;
    path: string;
    name: string;
    pinned: boolean;
    createdAt: number;
    lastOpenedAt: number | null;
    tags: string[];
    existsOnDisk: boolean;
  }> => ipcRenderer.invoke("app:setWorkspacePinned", id, pinned),
  setWorkspaceTags: (
    id: number,
    tags: string[],
  ): Promise<{
    id: number;
    path: string;
    name: string;
    pinned: boolean;
    createdAt: number;
    lastOpenedAt: number | null;
    tags: string[];
    existsOnDisk: boolean;
  }> => ipcRenderer.invoke("app:setWorkspaceTags", id, tags),
  pickWorkspaceDirectory: (): Promise<string | null> =>
    ipcRenderer.invoke("app:pickWorkspaceDirectory"),
});
