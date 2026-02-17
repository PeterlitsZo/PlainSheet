import { useContext } from "react";
import { useStore } from "zustand";

import { CopyUiContext } from "./copy-ui-provider";

const useTheme = () => {
  const copyUiContext = useContext(CopyUiContext);
  if (!copyUiContext) {
    throw new Error("useTheme must be used within a CopyUiProvider");
  }

  return useStore(copyUiContext, (state) => state.theme);
};

export { useTheme };
