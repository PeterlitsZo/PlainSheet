import { useJss } from "@renderer/components/CopyUiProvider";
import clsx from "clsx";
import type { ComponentProps, FC } from "react";
import { createContext, useContext } from "react";
import { useStore } from "zustand";

import { useScrollAreaContext } from "./scroll-area-context";
import styles from "./scroll-area-scrollbar.module.css";

type ScrollAreaScrollbarProps = ComponentProps<"div"> & {
  orientation?: "vertical" | "horizontal";
};

const ScrollAreaScrollbar: FC<ScrollAreaScrollbarProps> = (props) => {
  const {
    children,
    className,
    style,
    orientation = "vertical",
    ...rest
  } = props;

  const jss = useJss();

  const context = useScrollAreaContext();

  const hover = useStore(context, (state) => state.hover);
  const thumbDragging = useStore(context, (state) => state.thumbDragging);

  const show = hover || thumbDragging;
  const stx = jss.hash({
    visibility: show ? "visible" : "hidden",
  });

  const havingVerticalThumbShow = useStore(
    context,
    (state) => state.havingVerticalThumbShow,
  );
  const havingHorizontalThumbShow = useStore(
    context,
    (state) => state.havingHorizontalThumbShow,
  );

  const havingConflict =
    orientation === "vertical"
      ? havingHorizontalThumbShow
      : havingVerticalThumbShow;

  return (
    <ScrollAreaScrollbarContext value={{ orientation, havingConflict }}>
      <div
        className={clsx(styles.scrollAreaScrollbar, stx, className)}
        style={style}
        data-orientation={orientation}
        data-having-conflict={havingConflict ? "true" : "false"}
        {...rest}
      >
        {children}
      </div>
    </ScrollAreaScrollbarContext>
  );
};

ScrollAreaScrollbar.displayName = "ScrollArea.Scrollbar";

type ScrollAreaScrollbarCtx = {
  orientation: "vertical" | "horizontal";
  havingConflict: boolean;
};

const ScrollAreaScrollbarContext = createContext<ScrollAreaScrollbarCtx | null>(
  null,
);

function useScrollAreaScrollbarContext(): ScrollAreaScrollbarCtx {
  const context = useContext(ScrollAreaScrollbarContext);
  if (!context) {
    throw new Error(
      "useScrollAreaScrollbarContext must be used within the ScrollArea.Scrollbar",
    );
  }
  return context;
}

export type { ScrollAreaScrollbarProps };
export { ScrollAreaScrollbar, useScrollAreaScrollbarContext };
