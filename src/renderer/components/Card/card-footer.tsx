import { useJss, useTheme } from "@renderer/components/CopyUiProvider";
import clsx from "clsx";
import type { ComponentProps, FC } from "react";

import styles from "./card-footer.module.scss";

type CardFooterProps = ComponentProps<"div"> & {
  withBorder?: boolean;
};

const CardFooter: FC<CardFooterProps> = (props) => {
  const { children, className, withBorder = false, ...rest } = props;

  const jss = useJss();
  const theme = useTheme();

  const stx = jss.hash({
    "--cardFooter-bdColor": theme.colors.gray["300"],
  });

  return (
    <div
      className={clsx(styles.cardFooter, stx, className)}
      data-with-border={withBorder ? "true" : undefined}
      data-component="card-footer"
      {...rest}
    >
      {children}
    </div>
  );
};

CardFooter.displayName = "Card.Footer";

export { CardFooter };
