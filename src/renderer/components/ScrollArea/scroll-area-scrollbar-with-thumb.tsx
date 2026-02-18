import type { FC } from "react";

import {
  ScrollAreaScrollbar,
  type ScrollAreaScrollbarProps,
} from "./scroll-area-scrollbar";
import { ScrollAreaThumb } from "./scroll-area-thumb";

const ScrollAreaScrollbarWithThumb: FC<ScrollAreaScrollbarProps> = (props) => {
  return (
    <ScrollAreaScrollbar {...props}>
      <ScrollAreaThumb />
    </ScrollAreaScrollbar>
  );
};

ScrollAreaScrollbarWithThumb.displayName = "ScrollArea.ScrollbarWithThumb";

export { ScrollAreaScrollbarWithThumb };
