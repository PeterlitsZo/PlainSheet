/// <reference types="vite/client" />

declare global {
  type WorkspaceRecord = {
    id: number;
    path: string;
    name: string;
    pinned: boolean;
    createdAt: number;
    lastOpenedAt: number | null;
    tags: string[];
    existsOnDisk: boolean;
  };

  type CreateWorkspaceInput = {
    path: string;
    name?: string;
    pinned?: boolean;
    tags?: string[];
    lastOpenedAt?: number;
  };

  type UpdateWorkspaceInput = {
    id: number;
    path?: string;
    name?: string;
    pinned?: boolean;
    lastOpenedAt?: number;
  };

  interface Window {
    app: {
      renderTypstPng: (
        source: string,
        options?: { pixelPerPt?: number },
      ) => Promise<string>;
      listWorkspaces: () => Promise<WorkspaceRecord[]>;
      createWorkspace: (
        input: CreateWorkspaceInput,
      ) => Promise<WorkspaceRecord>;
      updateWorkspace: (
        input: UpdateWorkspaceInput,
      ) => Promise<WorkspaceRecord>;
      removeWorkspace: (id: number) => Promise<boolean>;
      setWorkspacePinned: (
        id: number,
        pinned: boolean,
      ) => Promise<WorkspaceRecord>;
      setWorkspaceTags: (
        id: number,
        tags: string[],
      ) => Promise<WorkspaceRecord>;
      pickWorkspaceDirectory: () => Promise<string | null>;
    };
  }
}

export {};
