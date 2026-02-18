import { useTheme } from "@renderer/components/CopyUiProvider";
import clsx from "clsx";
import type { ComponentProps, FC } from "react";

import styles from "./typography-code.module.css";

// Typography.Code
// =============================================================================

type TypographyCodeProps = ComponentProps<"code">;

const TypographyCode: FC<TypographyCodeProps> = (props) => {
  const { children, className, style, ...rest } = props;

  const theme = useTheme();

  const computedStyle = {
    "--typography-code-bg-color": theme.colors.gray["100"],
    "--typography-code-color": theme.colors.gray["900"],
    ...style,
  };

  return (
    <code
      className={clsx(styles.code, className)}
      style={computedStyle}
      {...rest}
    >
      {children}
    </code>
  );
};

// Export
// =============================================================================

export { TypographyCode };
