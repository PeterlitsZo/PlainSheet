import { useEffect, useState } from "react";

export default function App() {
  const [rustStatus, setRustStatus] = useState("Connecting to Rust...");

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

  return (
    <main className="app">
      <h1>PlainSheet</h1>
      <p>Electron Forge + Vite + React is ready.</p>
      <p>Rust status: {rustStatus}</p>
    </main>
  );
}
