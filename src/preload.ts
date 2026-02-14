import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("native", {
  renderTypstPng: (
    source: string,
    options?: { pixelPerPt?: number },
  ): Promise<string> =>
    ipcRenderer.invoke("rust:renderTypstPng", source, options),
});
