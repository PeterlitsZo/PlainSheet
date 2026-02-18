import { Typography } from "@renderer/components/Typography";
import clsx from "clsx";
import type { ComponentProps, FC } from "react";

import styles from "./card-content.module.scss";

type CardContentProps = ComponentProps<"div"> & {
  withTypography?: boolean;
};

const CardContent: FC<CardContentProps> = (props) => {
  const { children, className, withTypography = false, ...rest } = props;

  return (
    <div
      className={clsx(styles.cardContent, className)}
      data-component="card-content"
      {...rest}
    >
      {withTypography ? <Typography>{children}</Typography> : children}
    </div>
  );
};

CardContent.displayName = "Card.Content";

export { CardContent };
