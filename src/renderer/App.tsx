import { useCallback, useEffect, useRef, useState } from "react";

const initialInputText = "Hello from the input box!";

const buildTypstSource = (value: string) => {
  return value;
};

export default function App() {
  const [rustStatus, setRustStatus] = useState("Connecting to Rust...");
  const [typstStatus, setTypstStatus] = useState("Rendering Typst...");
  const [typstPngData, setTypstPngData] = useState<Uint8Array | null>(null);
  const [inputText, setInputText] = useState(initialInputText);
  const renderToken = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!window.rust) {
        setRustStatus("Rust bridge is not available.");
        return;
      }

      try {
        const response = await window.rust.plus100(23);
        if (cancelled) {
          return;
        }

        setRustStatus(`plus_100(23) = ${response}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!cancelled) {
          setRustStatus(`Rust plus_100 failed: ${message}`);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  const renderTypst = useCallback(async (value: string) => {
    if (!window.rust) {
      setTypstStatus("Rust bridge is not available.");
      return;
    }

    const requestId = renderToken.current + 1;
    renderToken.current = requestId;
    setTypstStatus("Rendering Typst...");

    try {
      const source = buildTypstSource(value);
      const png = await window.rust.renderTypstPng(source, {
        pixelPerPt: 4,
      });
      if (renderToken.current !== requestId) {
        return;
      }

      setTypstPngData(png);
      setTypstStatus("Rendered Typst PNG.");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (renderToken.current === requestId) {
        setTypstStatus(`Typst render failed: ${message}`);
      }
    }
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void renderTypst(inputText);
    }, 50);

    return () => {
      window.clearTimeout(handle);
    };
  }, [inputText, renderTypst]);

  useEffect(() => {
    if (!typstPngData) {
      return undefined;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    let cancelled = false;
    const pngBytes = new Uint8Array(typstPngData.byteLength);
    pngBytes.set(typstPngData);
    const objectUrl = URL.createObjectURL(
      new Blob([pngBytes], { type: "image/png" }),
    );
    const image = new Image();

    image.onload = () => {
      if (cancelled) {
        return;
      }

      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d");
      if (!context) {
        setTypstStatus("Canvas is not available.");
        return;
      }
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0);
      URL.revokeObjectURL(objectUrl);
    };

    image.onerror = () => {
      if (!cancelled) {
        setTypstStatus("Failed to decode PNG.");
      }
      URL.revokeObjectURL(objectUrl);
    };

    image.src = objectUrl;

    return () => {
      cancelled = true;
      URL.revokeObjectURL(objectUrl);
    };
  }, [typstPngData]);

  return (
    <main className="app">
      <h1>PlainSheet</h1>
      <p>Electron Forge + Vite + React is ready.</p>
      <p>Rust status: {rustStatus}</p>
      <div className="typst-controls">
        <label className="typst-label" htmlFor="typst-input">
          输入文本
        </label>
        <textarea
          id="typst-input"
          className="typst-input"
          value={inputText}
          onChange={(event) => setInputText(event.target.value)}
          placeholder="输入一些文本"
        />
      </div>
      <p>Typst status: {typstStatus}</p>
      <div className="typst-preview">
        <canvas className="typst-canvas" ref={canvasRef} />
      </div>
    </main>
  );
}
