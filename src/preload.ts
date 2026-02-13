import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("rust", {
  plus100: (input: number): Promise<number> =>
    ipcRenderer.invoke("rust:plus100", input),
  renderTypstSvg: (source: string): Promise<string> =>
    ipcRenderer.invoke("rust:renderTypstSvg", source),
  renderTypstPng: (
    source: string,
    options?: { pixelPerPt?: number },
  ): Promise<string> =>
    ipcRenderer.invoke("rust:renderTypstPng", source, options),
});
