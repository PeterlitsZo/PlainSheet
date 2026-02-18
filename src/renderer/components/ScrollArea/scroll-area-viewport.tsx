import clsx from "clsx";
import type { ComponentProps, FC } from "react";
import { useLayoutEffect, useRef } from "react";
import { useStore } from "zustand";

import { useScrollAreaContext } from "./scroll-area-context";
import styles from "./scroll-area-viewport.module.css";

type ScrollAreaViewportProps = ComponentProps<"div">;

const ScrollAreaViewport: FC<ScrollAreaViewportProps> = (props) => {
  const { children, className, ...rest } = props;

  const viewportRef = useRef<HTMLDivElement>(null);

  const context = useScrollAreaContext();

  const setViewportHeight = useStore(context, (s) => s.setViewportHeight);
  const setViewportWidth = useStore(context, (s) => s.setViewportWidth);
  const setScrollTop = useStore(context, (state) => state.setScrollTop);
  const setScrollLeft = useStore(context, (state) => state.setScrollLeft);
  const scrollTop = useStore(context, (state) => state.scrollTop);
  const scrollLeft = useStore(context, (state) => state.scrollLeft);
  const variant = useStore(context, (state) => state.variant);

  // Handle scroll and resize events.
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    // Observe content height changes.
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.borderBoxSize[0].blockSize;
        setViewportHeight(height);
        const width = entry.borderBoxSize[0].inlineSize;
        setViewportWidth(width);
      }
    });
    resizeObserver.observe(viewport);

    // Listen to scroll events.
    const handleScroll = () => {
      if (!viewport) return;
      setScrollTop(viewport.scrollTop);
      setScrollLeft(viewport.scrollLeft);
    };
    viewport.addEventListener("scroll", handleScroll);

    return () => {
      resizeObserver.unobserve(viewport);
      viewport.removeEventListener("scroll", handleScroll);
    };
  }, [setViewportHeight, setViewportWidth, setScrollTop, setScrollLeft]);

  // Sync scrollTop & scrollLeft state with actual scroll position.
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    if (Math.abs(viewport.scrollTop - scrollTop) > 1) {
      viewport.scrollTo({ top: scrollTop, behavior: "auto" });
    }
    if (Math.abs(viewport.scrollLeft - scrollLeft) > 1) {
      viewport.scrollTo({ left: scrollLeft, behavior: "auto" });
    }
  }, [scrollTop, scrollLeft]);

  return (
    <div
      ref={viewportRef}
      className={clsx(className, styles.scrollAreaViewport)}
      data-variant={variant}
      {...rest}
    >
      {children}
    </div>
  );
};

ScrollAreaViewport.displayName = "ScrollArea.Viewport";

export { ScrollAreaViewport };
