import { useTheme } from "@renderer/components/CopyUiProvider";
import clsx from "clsx";
import type { ComponentProps, FC } from "react";

import styles from "./typography-headings.module.css";

// Typography.H1
// =============================================================================

type TypographyH1Props = ComponentProps<"h1"> & {
  mt?: string;
  mb?: string;
};

const TypographyH1: FC<TypographyH1Props> = (props) => {
  const { children, className, style, mt, mb, ...rest } = props;

  const computedStyle = {
    marginTop: mt,
    marginBottom: mb,
    ...style,
  };

  return (
    <h1 className={clsx(styles.h1, className)} style={computedStyle} {...rest}>
      {children}
    </h1>
  );
};

// Typography.H2
// =============================================================================

type TypographyH2Props = ComponentProps<"h2"> & {
  mt?: string;
  mb?: string;
};

const TypographyH2: FC<TypographyH2Props> = (props) => {
  const { children, className, style, mt, mb, ...rest } = props;

  const theme = useTheme();

  const computedStyle = {
    "--typography-h2-border-color": theme.colors.gray["200"],
    marginTop: mt,
    marginBottom: mb,
    ...style,
  };

  return (
    <h2 className={clsx(styles.h2, className)} style={computedStyle} {...rest}>
      {children}
    </h2>
  );
};

// Typography.H3
// =============================================================================

type TypographyH3Props = ComponentProps<"h3"> & {
  mt?: string;
  mb?: string;
};

const TypographyH3: FC<TypographyH3Props> = (props) => {
  const { children, className, style, mt, mb, ...rest } = props;

  const computedStyle = {
    marginTop: mt,
    marginBottom: mb,
    ...style,
  };

  return (
    <h3 className={clsx(styles.h3, className)} style={computedStyle} {...rest}>
      {children}
    </h3>
  );
};

// Typography.H4
// =============================================================================

type TypographyH4Props = ComponentProps<"h4"> & {
  mt?: string;
  mb?: string;
};

const TypographyH4: FC<TypographyH4Props> = (props) => {
  const { children, className, style, mt, mb, ...rest } = props;

  const computedStyle = {
    marginTop: mt,
    marginBottom: mb,
    ...style,
  };

  return (
    <h4 className={clsx(styles.h4, className)} style={computedStyle} {...rest}>
      {children}
    </h4>
  );
};

// Export
// =============================================================================

export { TypographyH1, TypographyH2, TypographyH3, TypographyH4 };
