import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("native", {
  renderTypstPng: (
    source: string,
    options?: { pixelPerPt?: number },
  ): Promise<string> =>
    ipcRenderer.invoke("native:renderTypstPng", source, options),
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
  > => ipcRenderer.invoke("native:listWorkspaces"),
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
  }> => ipcRenderer.invoke("native:createWorkspace", input),
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
  }> => ipcRenderer.invoke("native:updateWorkspace", input),
  removeWorkspace: (id: number): Promise<boolean> =>
    ipcRenderer.invoke("native:removeWorkspace", id),
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
  }> => ipcRenderer.invoke("native:setWorkspacePinned", id, pinned),
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
  }> => ipcRenderer.invoke("native:setWorkspaceTags", id, tags),
});
