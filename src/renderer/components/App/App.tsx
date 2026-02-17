import { Button } from "@renderer/components/Button";
import { debounce } from "es-toolkit";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./App.module.css";
import { Editor } from "./Editor";
import { Preview } from "./Preview";

export function App() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [source, setSource] = useState("");
  const [workspaces, setWorkspaces] = useState<WorkspaceRecord[]>([]);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(
    null,
  );

  const renderToken = useRef(0);

  const selectedWorkspace = useMemo(
    () =>
      workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ??
      null,
    [workspaces, selectedWorkspaceId],
  );

  const loadWorkspaces = useCallback(async () => {
    setIsLoadingWorkspaces(true);
    try {
      const records = await window.app.listWorkspaces();
      setWorkspaces(records);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      alert(`Failed to load workspaces: ${message}`);
      setWorkspaces([]);
    } finally {
      setIsLoadingWorkspaces(false);
    }
  }, []);

  useEffect(() => {
    void loadWorkspaces();
  }, [loadWorkspaces]);

  useEffect(() => {
    if (
      selectedWorkspaceId !== null &&
      !workspaces.some((workspace) => workspace.id === selectedWorkspaceId)
    ) {
      setSelectedWorkspaceId(null);
    }
  }, [selectedWorkspaceId, workspaces]);

  const createWorkspace = useCallback(async () => {
    setIsCreatingWorkspace(true);
    try {
      const path = await window.app.pickWorkspaceDirectory();
      if (!path) {
        return;
      }

      const created = await window.app.createWorkspace({ path });
      await loadWorkspaces();
      setSelectedWorkspaceId(created.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      alert(`Failed to create workspace: ${message}`);
    } finally {
      setIsCreatingWorkspace(false);
    }
  }, [loadWorkspaces]);

  const renderTypst = useCallback(async (value: string) => {
    const requestId = renderToken.current + 1;
    renderToken.current = requestId;

    try {
      const png = await window.app.renderTypstPng(value, {
        pixelPerPt: 4,
      });
      if (renderToken.current !== requestId) {
        return;
      }

      setPreviewUrl(png);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const debouncedRender = useMemo(
    () =>
      debounce((value: string) => {
        void renderTypst(value);
      }, 16),
    [renderTypst],
  );

  useEffect(() => {
    if (selectedWorkspaceId === null) {
      debouncedRender.cancel();
      setPreviewUrl(null);
      return;
    }

    debouncedRender(source);
    return () => {
      debouncedRender.cancel();
    };
  }, [source, selectedWorkspaceId, debouncedRender]);

  if (selectedWorkspaceId === null || selectedWorkspace === null) {
    return (
      <main className={styles.PickerPage}>
        <section className={styles.PickerPanel}>
          <header className={styles.PickerHeader}>
            <h1 className={styles.PickerTitle}>Choose workspace</h1>
            <Button
              onClick={() => void createWorkspace()}
              disabled={isCreatingWorkspace}
            >
              {isCreatingWorkspace ? "Creating..." : "Create workspace"}
            </Button>
          </header>

          <div className={styles.WorkspaceList}>
            {isLoadingWorkspaces ? (
              <p className={styles.EmptyText}>Loading workspaces...</p>
            ) : workspaces.length === 0 ? (
              <p className={styles.EmptyText}>
                No workspaces yet. Create your first one.
              </p>
            ) : (
              workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  type="button"
                  className={styles.WorkspaceItem}
                  onClick={() => setSelectedWorkspaceId(workspace.id)}
                >
                  <span className={styles.WorkspaceName}>{workspace.name}</span>
                  <span className={styles.WorkspacePath}>{workspace.path}</span>
                  {!workspace.existsOnDisk ? (
                    <span className={styles.WorkspaceMissing}>
                      Missing on disk
                    </span>
                  ) : null}
                </button>
              ))
            )}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.Shell}>
      <aside className={styles.Sidebar}>
        <div className={styles.SidebarHeader}>
          <h2 className={styles.SidebarTitle}>{selectedWorkspace.name}</h2>
          <p className={styles.SidebarPath}>{selectedWorkspace.path}</p>
          {!selectedWorkspace.existsOnDisk ? (
            <p className={styles.WorkspaceMissing}>Missing on disk</p>
          ) : null}
        </div>

        <Button variant="light" onClick={() => setSelectedWorkspaceId(null)}>
          Switch workspace
        </Button>
      </aside>

      <section className={styles.Content}>
        <Editor onSourceChange={setSource} className={styles.Editor} />
        <Preview imageUrl={previewUrl} className={styles.Preview} />
      </section>
    </main>
  );
}
