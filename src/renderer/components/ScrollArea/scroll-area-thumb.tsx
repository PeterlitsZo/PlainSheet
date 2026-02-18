import { useJss, useTheme } from "@renderer/components/CopyUiProvider";
import clsx from "clsx";
import type { ComponentProps, FC } from "react";
import { useCallback, useEffect, useState } from "react";
import tinycolor from "tinycolor2";
import { type StoreApi, useStore } from "zustand";

import { useScrollAreaContext } from "./scroll-area-context";
import { useScrollAreaScrollbarContext } from "./scroll-area-scrollbar";
import type { ScrollAreaStore } from "./scroll-area-store";
import styles from "./scroll-area-thumb.module.css";

const CONFLICT_SIZE = 6;

type ScrollAreaThumbProps = ComponentProps<"div">;

const ScrollAreaThumb: FC<ScrollAreaThumbProps> = (props) => {
  const { orientation } = useScrollAreaScrollbarContext();

  if (orientation === "vertical") {
    return <ScrollAreaThumbVertical {...props} />;
  } else {
    return <ScrollAreaThumbHorizontal {...props} />;
  }
};

ScrollAreaThumb.displayName = "ScrollArea.Thumb";

const ScrollAreaThumbVertical: FC<ScrollAreaThumbProps> = (props) => {
  const { className, ...rest } = props;

  const theme = useTheme();
  const jss = useJss();

  const context = useScrollAreaContext();
  const { havingConflict } = useScrollAreaScrollbarContext();

  const contentHeight = useStore(context, (state) => state.contentHeight);
  const viewportHeight = useStore(context, (state) => state.viewportHeight);
  const scrollTop = useStore(context, (state) => state.scrollTop);
  const thumbDragging = useStore(context, (state) => state.thumbDragging);

  const [hover, setHover] = useState(false);

  const handleMouseDown: React.MouseEventHandler<HTMLDivElement> = useCallback(
    createMouseDownHandler(context, "vertical"),
    [],
  );

  if (contentHeight === 0 || viewportHeight === 0) {
    return null;
  }

  const scrollbarHeight = viewportHeight - (havingConflict ? CONFLICT_SIZE : 0);
  const thumbHeight = Math.max(
    (scrollbarHeight / contentHeight) * scrollbarHeight,
    20,
  );
  const thumbTop =
    (scrollTop / (contentHeight - viewportHeight)) *
    (scrollbarHeight - thumbHeight);

  if (contentHeight <= viewportHeight) {
    return null;
  }

  const alpha = hover || thumbDragging ? 0.5 : 0.3;
  const thumbBgColor = tinycolor(theme.colors.gray[500]).setAlpha(alpha);
  const computedStyle = {
    transform: `translateY(${thumbTop}px)`,
  };

  const stx = jss.hash({
    "--scrollAreaThumb-h": `${thumbHeight}px`,
    "--scrollAreaThumb-bgColor": thumbBgColor.toString(),
  });

  return (
    <ScrollAreaThumbVerticalInternal
      className={clsx(styles.scrollAreaThumb, stx, className)}
      style={computedStyle}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      data-orientation="vertical"
      {...rest}
    />
  );
};

const ScrollAreaThumbVerticalInternal: FC<ComponentProps<"div">> = (props) => {
  const context = useScrollAreaContext();

  useEffect(() => {
    const setHavingVerticalThumbShow =
      context.getState().setHavingVerticalThumbShow;

    setHavingVerticalThumbShow(true);
    return () => {
      setHavingVerticalThumbShow(false);
    };
  }, [context]);

  return <div {...props} />;
};

const ScrollAreaThumbHorizontal: FC<ScrollAreaThumbProps> = (props) => {
  const { className, ...rest } = props;

  const theme = useTheme();
  const jss = useJss();

  const context = useScrollAreaContext();
  const { havingConflict } = useScrollAreaScrollbarContext();

  const contentWidth = useStore(context, (state) => state.contentWidth);
  const viewportWidth = useStore(context, (state) => state.viewportWidth);
  const scrollLeft = useStore(context, (state) => state.scrollLeft);
  const thumbDragging = useStore(context, (state) => state.thumbDragging);

  const [hover, setHover] = useState(false);

  const handleMouseDown: React.MouseEventHandler<HTMLDivElement> = useCallback(
    createMouseDownHandler(context, "horizontal"),
    [],
  );

  if (contentWidth === 0 || viewportWidth === 0) {
    return null;
  }

  const scrollbarWidth = viewportWidth - (havingConflict ? CONFLICT_SIZE : 0);
  const thumbWidth = Math.max(
    (scrollbarWidth / contentWidth) * scrollbarWidth,
    20,
  );
  const thumbLeft =
    (scrollLeft / (contentWidth - viewportWidth)) *
    (scrollbarWidth - thumbWidth);

  if (contentWidth <= viewportWidth) {
    return null;
  }

  const alpha = hover || thumbDragging ? 0.5 : 0.3;
  const thumbBgColor = tinycolor(theme.colors.gray[500]).setAlpha(alpha);
  const computedStyle = {
    transform: `translateX(${thumbLeft}px)`,
  };

  const stx = jss.hash({
    "--scrollAreaThumb-w": `${thumbWidth}px`,
    "--scrollAreaThumb-bgColor": thumbBgColor.toString(),
  });

  return (
    <ScrollAreaThumbHorizontalInternal
      className={clsx(styles.scrollAreaThumb, stx, className)}
      style={computedStyle}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      data-orientation="horizontal"
      {...rest}
    />
  );
};

const ScrollAreaThumbHorizontalInternal: FC<ComponentProps<"div">> = (
  props,
) => {
  const context = useScrollAreaContext();

  useEffect(() => {
    const setHavingHorizontalThumbShow =
      context.getState().setHavingHorizontalThumbShow;
    setHavingHorizontalThumbShow(true);
    return () => {
      setHavingHorizontalThumbShow(false);
    };
  }, [context]);

  return <div {...props} />;
};

function createMouseDownHandler(
  store: StoreApi<ScrollAreaStore>,
  orientation: "vertical" | "horizontal",
) {
  return (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const start = orientation === "vertical" ? event.clientY : event.clientX;
    const startScroll =
      orientation === "vertical"
        ? store.getState().scrollTop
        : store.getState().scrollLeft;

    const setThumbDragging = store.getState().setThumbDragging;
    const viewportSize =
      orientation === "vertical"
        ? store.getState().viewportHeight
        : store.getState().viewportWidth;
    const contentSize =
      orientation === "vertical"
        ? store.getState().contentHeight
        : store.getState().contentWidth;
    const setScroll =
      orientation === "vertical"
        ? store.getState().setScrollTop
        : store.getState().setScrollLeft;

    setThumbDragging(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      moveEvent.stopPropagation();

      const delta =
        orientation === "vertical"
          ? moveEvent.clientY - start
          : moveEvent.clientX - start;
      let newScroll = startScroll + (delta / viewportSize) * contentSize;
      newScroll = Math.max(0, Math.min(newScroll, contentSize - viewportSize));
      setScroll(newScroll);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      upEvent.preventDefault();
      upEvent.stopPropagation();

      setThumbDragging(false);

      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };
}

export { ScrollAreaThumb };
