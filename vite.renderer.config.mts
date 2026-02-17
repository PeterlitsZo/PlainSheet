import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// https://vitejs.dev/config
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@renderer": fileURLToPath(new URL("./src/renderer", import.meta.url)),
    },
  },
});
