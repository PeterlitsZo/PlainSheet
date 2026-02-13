declare global {
  interface Window {
    rust: {
      plus100: (input: number) => Promise<number>;
    };
  }
}

export {};
