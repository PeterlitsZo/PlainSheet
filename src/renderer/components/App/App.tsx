import { debounce } from "es-toolkit";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./App.module.css";
import { Editor } from "./Editor";
import { Preview } from "./Preview";

export function App() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [source, setSource] = useState('');

  const renderToken = useRef(0);

  const renderTypst = useCallback(async (value: string) => {
    if (!window.native) {
      return;
    }

    const requestId = renderToken.current + 1;
    renderToken.current = requestId;

    try {
      const png = await window.native.renderTypstPng(value, {
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
    debouncedRender(source);
    return () => {
      debouncedRender.cancel();
    };
  }, [source, debouncedRender]);

  return (
    <main className={styles.App}>
      <Editor onSourceChange={setSource} className={styles.Editor} />
      <Preview imageUrl={previewUrl} className={styles.Preview} />
    </main>
  );
}
