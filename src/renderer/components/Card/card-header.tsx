import { useJss, useTheme } from "@renderer/components/CopyUiProvider";
import clsx from "clsx";
import type { ComponentProps, FC } from "react";

import styles from "./card-header.module.scss";

type CardHeaderProps = ComponentProps<"div"> & {
  withBorder?: boolean;
};

const CardHeader: FC<CardHeaderProps> = (props) => {
  const { children, className, withBorder = false, ...rest } = props;

  const jss = useJss();
  const theme = useTheme();

  const stx = jss.hash({
    "--cardHeader-bdColor": theme.colors.gray["300"],
  });

  return (
    <div
      className={clsx(styles.cardHeader, stx, className)}
      data-with-border={withBorder ? "true" : undefined}
      data-component="card-header"
      {...rest}
    >
      {children}
    </div>
  );
};

CardHeader.displayName = "Card.Header";

export { CardHeader };
