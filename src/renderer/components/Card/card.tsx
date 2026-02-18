import { useJss } from "@renderer/components/CopyUiProvider";
import { Paper } from "@renderer/components/Paper";
import clsx from "clsx";
import type { ComponentProps, FC } from "react";

import styles from "./card.module.scss";
import { CardContent } from "./card-content";
import { CardContentInScrollArea } from "./card-content-in-scroll-area";
import { CardFooter } from "./card-footer";
import { CardHeader } from "./card-header";

type CardProps = ComponentProps<typeof Paper> & {
  width?: string;
  maxWidth?: string;
};

type CardComponent = FC<CardProps> & {
  Header: typeof CardHeader;
  Content: typeof CardContent;
  ContentInScrollArea: typeof CardContentInScrollArea;
  Footer: typeof CardFooter;
};

const Card: CardComponent = (props: CardProps) => {
  // TODO (PeterlitsZo): Remove the default width in the future.
  const {
    radius = "md",
    withBorder = true,
    width = "20rem",
    maxWidth,
    children,
    ...rest
  } = props;

  const jss = useJss();

  const stx = jss.hash({
    "--card-width": width,
    "--card-max-width": maxWidth,
  });

  return (
    <Paper
      radius={radius}
      withBorder={withBorder}
      className={clsx(styles.card, stx)}
      {...rest}
    >
      {children}
    </Paper>
  );
};

Card.displayName = "Card";

Card.Header = CardHeader;
Card.Content = CardContent;
Card.ContentInScrollArea = CardContentInScrollArea;
Card.Footer = CardFooter;

export { Card };
