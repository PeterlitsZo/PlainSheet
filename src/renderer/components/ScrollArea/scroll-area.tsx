import clsx from "clsx";
import type { ComponentProps, FC } from "react";
import { useEffect, useRef } from "react";
import { type StoreApi, useStore } from "zustand";

import styles from "./scroll-area.module.css";
import { ScrollAreaContent } from "./scroll-area-content";
import { ScrollAreaContext } from "./scroll-area-context";
import { ScrollAreaScrollbar } from "./scroll-area-scrollbar";
import { ScrollAreaScrollbarWithThumb } from "./scroll-area-scrollbar-with-thumb";
import type { ScrollAreaStore } from "./scroll-area-store";
import { buildScrollAreaStore } from "./scroll-area-store";
import { ScrollAreaThumb } from "./scroll-area-thumb";
import { ScrollAreaViewport } from "./scroll-area-viewport";

type ScrollAreaProps = ComponentProps<"div"> & {
  variant?: "default" | "absolute";
  children: React.ReactNode;
};

type ScrollAreaComponent = FC<ScrollAreaProps> & {
  Viewport: typeof ScrollAreaViewport;
  Content: typeof ScrollAreaContent;
  Scrollbar: typeof ScrollAreaScrollbar;
  Thumb: typeof ScrollAreaThumb;
  ScrollbarWithThumb: typeof ScrollAreaScrollbarWithThumb;
};

const ScrollArea: ScrollAreaComponent = (props: ScrollAreaProps) => {
  const { variant = "default", children, className, ...rest } = props;

  const scrollAreaStoreRef = useRef<StoreApi<ScrollAreaStore> | null>(null);
  if (scrollAreaStoreRef.current === null) {
    scrollAreaStoreRef.current = buildScrollAreaStore();
  }

  useEffect(() => {
    const store = scrollAreaStoreRef.current;
    if (store) {
      store.getState().setVariant(variant);
    }
  }, [variant]);

  const setHover = useStore(
    scrollAreaStoreRef.current,
    (state) => state.setHover,
  );

  return (
    <ScrollAreaContext value={scrollAreaStoreRef.current}>
      <div
        className={clsx(styles.scrollArea, className)}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
        {...rest}
      >
        {children}
      </div>
    </ScrollAreaContext>
  );
};

ScrollArea.displayName = "ScrollArea";

ScrollArea.Viewport = ScrollAreaViewport;
ScrollArea.Content = ScrollAreaContent;
ScrollArea.Scrollbar = ScrollAreaScrollbar;
ScrollArea.Thumb = ScrollAreaThumb;
ScrollArea.ScrollbarWithThumb = ScrollAreaScrollbarWithThumb;

export { ScrollArea };
