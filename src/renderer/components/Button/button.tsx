import type { ColorName, Theme } from "@renderer/components/CopyUiProvider";
import { useJss, useTheme } from "@renderer/components/CopyUiProvider";
import { resolveStyle2 } from "@renderer/utils/resolve-style2";
import clsx from "clsx";
import type { ComponentProps, FC } from "react";
import tinycolor from "tinycolor2";

import styles from "./button.module.scss";

export type ButtonProps = ComponentProps<"button"> & {
  variant?: "default" | "filled" | "light" | "secondary" | "ghost" | "link";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  color?: ColorName;

  leftSection?: React.ReactNode;
  rightSection?: React.ReactNode;
};

const Button: FC<ButtonProps> = (props) => {
  const {
    className,
    children,
    leftSection,
    rightSection,
    disabled,
    variant = "default",
    size = "md",
    color = "blue",
    ...rest
  } = props;

  const theme = useTheme();
  const jss = useJss();

  const baseStx = jss.hash({
    "--button-bdRadius": "0.375rem",
  });

  const stx = jss.hash(
    buttonStyle(
      theme,
      color,
    )({
      variant,
      size,
    }),
  );

  return (
    <button
      className={clsx(styles.button, baseStx, stx, className)}
      disabled={disabled}
      data-disabled={disabled ? true : undefined}
      data-variant={variant}
      {...rest}
    >
      {leftSection && (
        <span className={styles.buttonLeftSection}>{leftSection}</span>
      )}
      <span>{children}</span>
      {rightSection && (
        <span className={styles.buttonRightSection}>{rightSection}</span>
      )}
    </button>
  );
};

Button.displayName = "Button";

const buttonStyle = (theme: Theme, color: ColorName) =>
  resolveStyle2({
    variant: {
      default: {
        "--button-bgColor": "white",
        "--button-color": theme.colors.gray["800"],
        "--button-bdWidth": "1px",
        "--button-bdStyle": "solid",
        "--button-bdColor": theme.colors.gray["300"],
        "--button-hover-bgColor": theme.colors.gray["050"],
        "--button-disabled-bgColor": theme.colors.gray["100"],
        "--button-disabled-color": theme.colors.gray["500"],
        "--button-disabled-bdColor": theme.colors.gray["250"],
        "--button-disabled-hover-bgColor": theme.colors.gray["100"],
      },
      filled: {
        "--button-bgColor": theme.colors[color]["600"],
        "--button-color": "white",
        "--button-bdWidth": "1px",
        "--button-bdStyle": "solid",
        "--button-bdColor": theme.colors[color]["600"],
        "--button-hover-bgColor": theme.colors[color]["650"],
        "--button-hover-bdColor": theme.colors[color]["650"],
        "--button-disabled-bgColor": theme.colors.gray["300"],
        "--button-disabled-color": theme.colors.gray["500"],
        "--button-disabled-bdColor": theme.colors.gray["300"],
        "--button-disabled-hover-bgColor": theme.colors.gray["300"],
      },
      secondary: {
        "--button-bgColor": theme.colors.gray["100"],
        "--button-color": theme.colors.gray["800"],
        "--button-bdWidth": "1px",
        "--button-bdStyle": "solid",
        "--button-bdColor": "transparent",
        "--button-separatorBdColor": theme.colors.gray["200"],
        "--button-hover-bgColor": theme.colors.gray["200"],
        "--button-disabled-bgColor": theme.colors.gray["100"],
        "--button-disabled-color": theme.colors.gray["500"],
        "--button-disabled-bdColor": "transparent",
        "--button-disabled-hover-bgColor": theme.colors.gray["100"],
      },
      ghost: {
        "--button-bgColor": "transparent",
        "--button-color": theme.colors[color]["700"],
        "--button-bdWidth": "1px",
        "--button-bdStyle": "solid",
        "--button-bdColor": "transparent",
        "--button-hover-bgColor": tinycolor(theme.colors.gray["200"])
          .setAlpha(0.5)
          .toString(),
        "--button-disabled-color": theme.colors.gray["500"],
        "--button-disabled-bgColor": "transparent",
        "--button-disabled-hover-bgColor": "transparent",
        "--button-disabled-bdColor": "transparent",
      },
      light: {
        "--button-bgColor": theme.colors[color]["100"],
        "--button-color": theme.colors[color]["700"],
        "--button-bdWidth": "1px",
        "--button-bdStyle": "solid",
        "--button-bdColor": "transparent",
        "--button-separatorBdColor": theme.colors[color]["100"],
        "--button-hover-bgColor": theme.colors[color]["200"],
        "--button-disabled-color": theme.colors.gray["500"],
        "--button-disabled-bgColor": theme.colors.gray["100"],
        "--button-disabled-hover-bgColor": theme.colors.gray["100"],
        "--button-disabled-bdColor": "transparent",
      },
      link: {
        "--button-bgColor": "transparent",
        "--button-color": theme.colors[color]["700"],
        "--button-bdWidth": "0px",
        "--button-bdStyle": "solid",
        "--button-bdColor": "transparent",
        "--button-hover-bgColor": "transparent",
        "--button-disabled-color": theme.colors.gray["500"],
        "--button-disabled-bgColor": "transparent",
        "--button-disabled-hover-bgColor": "transparent",
        "--button-disabled-bdColor": "transparent",
      },
    },
    size: {
      xs: {
        "--button-height": theme.tokens.inputBaseXsHeight,
        "--icon-size": `calc(var(--button-height) / 2.125)`,
        "--button-px": "0.625rem",
        "--button-sectionGap": "0.375rem",
        "--button-fontSize": "0.75rem",
      },
      sm: {
        "--button-height": theme.tokens.inputBaseSmHeight,
        "--icon-size": `calc(var(--button-height) / 2.125)`,
        "--button-px": "0.75rem",
        "--button-sectionGap": "0.5rem",
        "--button-fontSize": "0.875rem",
      },
      md: {
        "--button-height": theme.tokens.inputBaseMdHeight,
        "--icon-size": `calc(var(--button-height) / 2.125)`,
        "--button-px": "1rem",
        "--button-sectionGap": "0.625rem",
        "--button-fontSize": "1rem",
      },
      lg: {
        "--button-height": theme.tokens.inputBaseLgHeight,
        "--icon-size": `calc(var(--button-height) / 2.125)`,
        "--button-px": "1.25rem",
        "--button-sectionGap": "0.75rem",
        "--button-fontSize": "1.125rem",
      },
      xl: {
        "--button-height": theme.tokens.inputBaseXlHeight,
        "--icon-size": `calc(var(--button-height) / 2.125)`,
        "--button-px": "1.5rem",
        "--button-sectionGap": "1rem",
        "--button-fontSize": "1.25rem",
      },
    },
  });

export { Button };
