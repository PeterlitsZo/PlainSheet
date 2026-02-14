/// <reference types="vite/client" />

declare global {
  interface Window {
    native: {
      renderTypstPng: (
        source: string,
        options?: { pixelPerPt?: number },
      ) => Promise<string>;
    };
  }
}

export {};
