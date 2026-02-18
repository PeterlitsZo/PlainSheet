import { createRoot } from "react-dom/client";

import "./reset.css";

import { App } from "./components/App";
import { CopyUiProvider } from "./components/CopyUiProvider";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root not found");
}

createRoot(rootElement).render(
  <CopyUiProvider>
    <App />
  </CopyUiProvider>,
);
