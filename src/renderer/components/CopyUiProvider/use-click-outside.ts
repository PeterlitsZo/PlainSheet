import { useContext, useEffect } from "react";
import { useStore } from "zustand";

import { CopyUiContext } from "./copy-ui-provider";

function useClickOutside(
  el: HTMLElement | null,
  callback: (event: MouseEvent) => void,
) {
  const copyUiContext = useContext(CopyUiContext);
  if (!copyUiContext) {
    throw new Error("useClickOutside must be used within a CopyUiProvider");
  }

  const eventListener = useStore(
    copyUiContext,
    (state) => state.clickOutsideEventListener,
  );

  useEffect(() => {
    if (!el) return;

    const callbackInternal = (event: MouseEvent) => {
      callback(event);
    };
    eventListener.register(el, callbackInternal);
    return () => {
      eventListener.unregister(el, callbackInternal);
    };
  }, [el, callback, eventListener]);
}

export { useClickOutside };
