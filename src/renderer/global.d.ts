/// <reference types="vite/client" />

declare global {
  interface Window {
    rust: {
      plus100: (input: number) => Promise<number>;
      renderTypstSvg: (source: string) => Promise<string>;
      renderTypstPng: (
        source: string,
        options?: { pixelPerPt?: number },
      ) => Promise<Uint8Array<ArrayBuffer>>;
    };
  }
}

export {};
