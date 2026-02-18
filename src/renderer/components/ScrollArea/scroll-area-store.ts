import { createStore } from "zustand";

type ScrollAreaStoreState = {
  variant: "default" | "absolute";

  havingVerticalThumbShow: boolean;
  havingHorizontalThumbShow: boolean;

  hover: boolean;
  thumbDragging: boolean;

  contentHeight: number;
  contentWidth: number;
  viewportHeight: number;
  viewportWidth: number;
  scrollTop: number;
  scrollLeft: number;
};

type ScrollAreaStoreActions = {
  setVariant: (variant: "default" | "absolute") => void;

  setHavingVerticalThumbShow: (havingVerticalScrollbar: boolean) => void;
  setHavingHorizontalThumbShow: (havingHorizontalScrollbar: boolean) => void;

  setHover: (hover: boolean) => void;
  setThumbDragging: (dragging: boolean) => void;

  setContentHeight: (height: number) => void;
  setContentWidth: (width: number) => void;
  setViewportHeight: (height: number) => void;
  setViewportWidth: (width: number) => void;
  setScrollTop: (scrollTop: number) => void;
  setScrollLeft: (scrollLeft: number) => void;
};

type ScrollAreaStore = ScrollAreaStoreState & ScrollAreaStoreActions;

function buildScrollAreaStore() {
  return createStore<ScrollAreaStore>()((set) => ({
    variant: "default",

    havingVerticalThumbShow: false,
    havingHorizontalThumbShow: false,

    hover: false,
    thumbDragging: false,

    contentHeight: 0,
    contentWidth: 0,
    viewportHeight: 0,
    viewportWidth: 0,
    scrollTop: 0,
    scrollLeft: 0,

    setVariant: (variant) => set(() => ({ variant })),

    setHavingVerticalThumbShow: (havingVerticalScrollbar) =>
      set(() => ({ havingVerticalThumbShow: havingVerticalScrollbar })),
    setHavingHorizontalThumbShow: (havingHorizontalScrollbar) =>
      set(() => ({ havingHorizontalThumbShow: havingHorizontalScrollbar })),

    setHover: (hover) => set(() => ({ hover })),
    setThumbDragging: (dragging) => set(() => ({ thumbDragging: dragging })),

    setContentHeight: (height) => set(() => ({ contentHeight: height })),
    setContentWidth: (width) => set(() => ({ contentWidth: width })),
    setViewportHeight: (height) => set(() => ({ viewportHeight: height })),
    setViewportWidth: (width) => set(() => ({ viewportWidth: width })),
    setScrollTop: (scrollTop) => set(() => ({ scrollTop })),
    setScrollLeft: (scrollLeft) => set(() => ({ scrollLeft })),
  }));
}

export type { ScrollAreaStore };
export { buildScrollAreaStore };
