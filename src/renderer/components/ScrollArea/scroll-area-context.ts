import { createContext, useContext } from "react";
import type { StoreApi } from "zustand";

import type { ScrollAreaStore } from "./scroll-area-store";

const ScrollAreaContext = createContext<StoreApi<ScrollAreaStore> | null>(null);

const useScrollAreaContext = (): StoreApi<ScrollAreaStore> => {
  const context = useContext(ScrollAreaContext);
  if (!context) {
    throw new Error("useScrollAreaContext must be used within the ScrollArea");
  }
  return context;
};

export { ScrollAreaContext, useScrollAreaContext };
