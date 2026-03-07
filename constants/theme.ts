import { Platform } from "react-native";

const tintColorLight = "#00439C"; // PlayStation blue
const tintColorDark = "#4DA6FF"; // PlayStation blue (dark)

export const Colors = {
  light: {
    text: "#11181C",
    background: "#F2F2F7",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: "#ECEDEE",
    background: "#000000",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
  },
};

/** PlayStation brand palette */
export const PsColors = {
  bluePrimary: { light: "#00439C", dark: "#0070D1" },
  blueAccent: { light: "#0070D1", dark: "#4DA6FF" },
};

/** Trophy grade colours */
export const TrophyColors = {
  platinum: { light: "#B0C4DE", dark: "#C8D8E8" },
  gold: { light: "#D4AF37", dark: "#FFD700" },
  silver: { light: "#A8A9AD", dark: "#C0C0C0" },
  bronze: { light: "#CD7F32", dark: "#E8956D" },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
