import type { ComponentProps, FC } from "react";
import { useCallback, useLayoutEffect, useRef } from "react";
import { useStore } from "zustand";

import { useScrollAreaContext } from "./scroll-area-context";

type ScrollAreaContentProps = ComponentProps<"div"> & {
  children: React.ReactNode;
};

const ScrollAreaContent: FC<ScrollAreaContentProps> = (props) => {
  const { ref, children, ...rest } = props;

  const contentRef = useRef<HTMLDivElement>(null);

  const context = useScrollAreaContext();

  const setContentHeight = useStore(context, (state) => state.setContentHeight);
  const setContentWidth = useStore(context, (state) => state.setContentWidth);
  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    // Observe content height & width changes.
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.borderBoxSize[0].blockSize;
        setContentHeight(height);
        const width = entry.borderBoxSize[0].inlineSize;
        setContentWidth(width);
      }
    });
    resizeObserver.observe(content);

    return () => {
      resizeObserver.unobserve(content);
    };
  }, [setContentHeight, setContentWidth]);

  const setRef = useCallback(
    (el: HTMLDivElement) => {
      contentRef.current = el;
      if (typeof ref === "function") {
        ref(el);
      } else if (ref) {
        ref.current = el;
      }
    },
    [ref],
  );

  return (
    <div ref={setRef} {...rest}>
      {children}
    </div>
  );
};

ScrollAreaContent.displayName = "ScrollArea.Content";

export { ScrollAreaContent };
