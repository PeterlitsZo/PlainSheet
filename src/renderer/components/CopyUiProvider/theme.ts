export type ColorName =
  | "gray"
  | "red"
  | "pink"
  | "grape"
  | "violet"
  | "indigo"
  | "blue"
  | "cyan"
  | "teal"
  | "green"
  | "lime"
  | "yellow"
  | "orange";

export type ColorNo =
  | "000"
  | "050"
  | "100"
  | "150"
  | "200"
  | "250"
  | "350"
  | "300"
  | "400"
  | "450"
  | "500"
  | "550"
  | "600"
  | "650"
  | "700"
  | "750"
  | "800"
  | "850"
  | "900"
  | "950";

export interface Theme {
  colors: {
    [colorName in ColorName]: { [colorNo in ColorNo]: string };
  };
  shadow: {
    xxs: string;
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  tokens: {
    inputBaseDefaultBorderColor: string;

    inputBaseXsHeight: string;
    inputBaseSmHeight: string;
    inputBaseMdHeight: string;
    inputBaseLgHeight: string;
    inputBaseXlHeight: string;

    inputBaseXsFontSize: string;
    inputBaseSmFontSize: string;
    inputBaseMdFontSize: string;
    inputBaseLgFontSize: string;
    inputBaseXlFontSize: string;

    inputBaseXsLineHeight: string;
    inputBaseSmLineHeight: string;
    inputBaseMdLineHeight: string;
    inputBaseLgLineHeight: string;
    inputBaseXlLineHeight: string;

    inputBaseBorderRadius: string;

    inputBasePlaceholderColor: string;
  };
}
