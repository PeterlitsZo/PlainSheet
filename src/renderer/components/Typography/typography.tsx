import clsx from "clsx";
import type { ComponentProps, FC } from "react";

import styles from "./typography.module.css";
import { TypographyCode } from "./typography-code";
import {
  TypographyA,
  TypographyEm,
  TypographyP,
  TypographyStrong,
} from "./typography-common";
import {
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyH4,
} from "./typography-headings";
import { TypographyLi, TypographyOl, TypographyUl } from "./typography-list";

type TypographyProps = ComponentProps<"div">;

type ComponentTypography = FC<TypographyProps> & {
  H1: typeof TypographyH1;
  H2: typeof TypographyH2;
  H3: typeof TypographyH3;
  H4: typeof TypographyH4;

  P: typeof TypographyP;
  Strong: typeof TypographyStrong;
  Em: typeof TypographyEm;
  A: typeof TypographyA;

  Ul: typeof TypographyUl;
  Ol: typeof TypographyOl;
  Li: typeof TypographyLi;

  Code: typeof TypographyCode;
};

const Typography: ComponentTypography = (props: TypographyProps) => {
  const { children, className, ...rest } = props;

  return (
    <div className={clsx(styles.typography, className)} {...rest}>
      {children}
    </div>
  );
};

Typography.H1 = TypographyH1;
Typography.H2 = TypographyH2;
Typography.H3 = TypographyH3;
Typography.H4 = TypographyH4;

Typography.P = TypographyP;
Typography.Strong = TypographyStrong;
Typography.Em = TypographyEm;
Typography.A = TypographyA;

Typography.Ul = TypographyUl;
Typography.Ol = TypographyOl;
Typography.Li = TypographyLi;

Typography.Code = TypographyCode;

Typography.displayName = "Typography";

export { Typography };
