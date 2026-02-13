import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("rust", {
  plus100: (input: number): Promise<number> =>
    ipcRenderer.invoke("rust:plus100", input),
});
