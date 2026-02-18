import { ScrollArea } from "@renderer/components/ScrollArea";
import { Typography } from "@renderer/components/Typography";
import type { ComponentProps, FC } from "react";

import styles from "./card-content-in-scroll-area.module.scss";

type CardContentInScrollAreaProps = ComponentProps<"div"> & {
  withTypography?: boolean;
};

const CardContentInScrollArea: FC<CardContentInScrollAreaProps> = (props) => {
  const { children, className, style, withTypography = false, ...rest } = props;

  return (
    <ScrollArea
      data-component="card-content-in-scroll-area"
      className={styles.cardContentInScrollArea}
      {...rest}
    >
      <ScrollArea.Viewport className={className} style={style}>
        <ScrollArea.Content className={styles.cardContentInScrollAreaContent}>
          {withTypography ? <Typography>{children}</Typography> : children}
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.ScrollbarWithThumb />
    </ScrollArea>
  );
};

CardContentInScrollArea.displayName = "Card.ContentInScrollArea";

export { CardContentInScrollArea };
