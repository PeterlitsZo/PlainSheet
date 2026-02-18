import { useJss, useTheme } from "@renderer/components/CopyUiProvider";
import clsx from "clsx";
import type { ComponentProps, FC } from "react";

import styles from "./typography-common.module.css";

// Typography.Strong
// =============================================================================

type TypographyStrongProps = ComponentProps<"strong">;

const TypographyStrong: FC<TypographyStrongProps> = (props) => {
  const { className, children, ...rest } = props;

  return (
    <strong className={clsx(styles.strong, className)} {...rest}>
      {children}
    </strong>
  );
};

TypographyStrong.displayName = "Typography.Strong";

// Typography.Em
// =============================================================================

type TypographyEmProps = ComponentProps<"em">;

const TypographyEm: FC<TypographyEmProps> = (props) => {
  const { className, children, ...rest } = props;

  return (
    <strong className={clsx(styles.em, className)} {...rest}>
      {children}
    </strong>
  );
};

TypographyEm.displayName = "Typography.Em";

// Typography.P
// =============================================================================

type TypographyPProps = ComponentProps<"p"> & {
  mt?: string;
  mb?: string;
};

const TypographyP: FC<TypographyPProps> = (props) => {
  const { children, className, style, mt, mb, ...rest } = props;

  const computedStyle = {
    marginTop: mt,
    marginBottom: mb,
    ...style,
  };

  return (
    <p className={clsx(styles.p, className)} style={computedStyle} {...rest}>
      {children}
    </p>
  );
};

// Typography.A
// =============================================================================

type TypographyAProps = ComponentProps<"a">;

const TypographyA: FC<TypographyAProps> = (props) => {
  const { className, children, ...rest } = props;

  const jss = useJss();
  const theme = useTheme();

  const stx = jss.hash({
    "--typographyA-color": theme.colors.blue["700"],
  });

  return (
    <a className={clsx(styles.a, stx, className)} {...rest}>
      {children}
    </a>
  );
};

// Export
// =============================================================================

export { TypographyStrong, TypographyEm, TypographyP, TypographyA };
