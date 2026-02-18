/**
 * resolve-style2 from copy-ui (version: 0.1.0, date: 2025-11-23).
 *
 * The helper to calculate styles at runtime.
 */

import type { CSSProperties } from "react";

type Style = CSSProperties & Record<`--${string}`, string>;

type UnresolvedStyle = Record<string, Record<string, Style>>;

function resolveStyle2(style: UnresolvedStyle) {
  return (arg: Record<string, string>): CSSProperties => {
    const result = {};

    for (const argVariant in arg) {
      const variantValue = arg[argVariant];
      const variantStyles = style[argVariant][variantValue];
      Object.assign(result, variantStyles);
    }

    return result;
  };
}

export { resolveStyle2 };
