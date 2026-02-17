import { useContext } from "react";
import { useStore } from "zustand";

import { CopyUiContext } from "./copy-ui-provider";

const useJss = () => {
  const copyUiContext = useContext(CopyUiContext);
  if (!copyUiContext) {
    throw new Error("useJss must be used within a CopyUiProvider");
  }

  return useStore(copyUiContext, (state) => state.jssState);
};

export { useJss };
