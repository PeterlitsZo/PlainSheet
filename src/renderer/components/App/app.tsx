import { Button } from "@renderer/components/Button";
import { Card } from "@renderer/components/Card";
import { debounce } from "es-toolkit";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./app.module.css";
import { Editor } from "./editor";
import { Preview } from "./preview";

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
      <main className={styles.pickerPage}>
        <Card width="min(40rem, 100%)" maxWidth="100%" radius="lg">
          <Card.Header withBorder className={styles.cardHeader}>
            <h1>Choose workspace</h1>
            <Button
              variant="filled"
              onClick={() => void createWorkspace()}
              disabled={isCreatingWorkspace}
            >
              {isCreatingWorkspace ? "Creating..." : "Create workspace"}
            </Button>
          </Card.Header>

          <Card.ContentInScrollArea className={styles.workspaceList}>
            {isLoadingWorkspaces ? (
              <p className={styles.emptyText}>Loading workspaces...</p>
            ) : workspaces.length === 0 ? (
              <p className={styles.emptyText}>
                No workspaces yet. Create your first one.
              </p>
            ) : (
              workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  type="button"
                  className={styles.workspaceItem}
                  onClick={() => setSelectedWorkspaceId(workspace.id)}
                >
                  <span className={styles.workspaceName}>{workspace.name}</span>
                  <span className={styles.workspacePath}>{workspace.path}</span>
                  {!workspace.existsOnDisk ? (
                    <span className={styles.workspaceMissing}>
                      Missing on disk
                    </span>
                  ) : null}
                </button>
              ))
            )}
          </Card.ContentInScrollArea>
        </Card>
      </main>
    );
  }

  return (
    <main className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>{selectedWorkspace.name}</h2>
          <p className={styles.sidebarPath}>{selectedWorkspace.path}</p>
          {!selectedWorkspace.existsOnDisk ? (
            <p className={styles.workspaceMissing}>Missing on disk</p>
          ) : null}
        </div>

        <Button
          variant="filled"
          onClick={() => setSelectedWorkspaceId(null)}
          size="sm"
        >
          Switch workspace
        </Button>
      </aside>

      <section className={styles.content}>
        <Editor onSourceChange={setSource} className={styles.editor} />
        <Preview imageUrl={previewUrl} className={styles.preview} />
      </section>
    </main>
  );
}
