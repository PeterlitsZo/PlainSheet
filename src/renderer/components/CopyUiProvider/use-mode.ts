import { useContext } from "react";
import { useStore } from "zustand";

import { CopyUiContext } from "./copy-ui-provider";

const useMode = () => {
  const copyUiContext = useContext(CopyUiContext);
  if (!copyUiContext) {
    throw new Error("useMode must be used within a CopyUiProvider");
  }

  return useStore(copyUiContext, (state) => state.mode);
};

const useSetMode = () => {
  const copyUiContext = useContext(CopyUiContext);
  if (!copyUiContext) {
    throw new Error("useSetMode must be used within a CopyUiProvider");
  }

  const setMode = useStore(copyUiContext, (state) => state.setMode);

  return (
    mode: "light" | "dark" | ((prevMode: "light" | "dark") => "light" | "dark"),
  ) => {
    setMode(mode);
  };
};

export { useMode, useSetMode };
