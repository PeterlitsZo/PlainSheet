import { createJssState, type JssState } from "@renderer/utils/jss";
import { createContext, type FC, useEffect, useRef, useState } from "react";
import { createStore, type StoreApi } from "zustand";

import { ClickOutsideEventListener } from "./click-outside-event-listener";
import { DEFAULT_THEME } from "./default-theme";
import type { Theme } from "./theme";
import { useJss } from "./use-jss";

type CopyUiStoreState = {
  theme: Theme;
  mode: "light" | "dark";

  jssState: JssState;

  clickOutsideEventListener: ClickOutsideEventListener;
};

type CopyUiStoreActions = {
  setMode: (
    mode: "light" | "dark" | ((prevMode: "light" | "dark") => "light" | "dark"),
  ) => void;
};

type CopyUiStore = CopyUiStoreState & CopyUiStoreActions;

const CopyUiContext = createContext<StoreApi<CopyUiStore> | null>(null);

type CopyUiProviderProps = {
  children?: React.ReactNode;
};

const CopyUiProvider: FC<CopyUiProviderProps> = (props) => {
  const { children } = props;
  const content = children;

  const storeRef = useRef<StoreApi<CopyUiStore> | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createStore<CopyUiStore>()((set) => ({
      theme: DEFAULT_THEME,
      mode: "light",

      jssState: createJssState(),

      clickOutsideEventListener: new ClickOutsideEventListener(),

      setMode: (mode) => {
        set((state) => ({
          mode: typeof mode === "function" ? mode(state.mode) : mode,
        }));
      },
    }));
  }

  return (
    <CopyUiContext.Provider value={storeRef.current}>
      {content}
      <JssSsrCss />
    </CopyUiContext.Provider>
  );
};

const JssSsrCss = () => {
  const jss = useJss();
  const css = jss.extractSsrCss();
  const [jssSsr, setJssSsr] = useState(true);

  useEffect(() => {
    // Remove the style tag after hydration.
    setJssSsr(false);
  }, []);

  if (!jssSsr) {
    return null;
  } else {
    return <style suppressHydrationWarning={true}>{css}</style>;
  }
};

CopyUiProvider.displayName = "CopyUiProvider";

export { CopyUiContext, CopyUiProvider };
