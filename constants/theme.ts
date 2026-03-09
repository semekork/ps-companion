import { Platform } from "react-native";

import { PS_COLORS } from "./colors";

const tintColorLight = PS_COLORS.darkBlue;
const tintColorDark = PS_COLORS.accentBlue;

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
  bluePrimary: { light: PS_COLORS.darkBlue, dark: PS_COLORS.blue },
  blueAccent: { light: PS_COLORS.blue, dark: PS_COLORS.accentBlue },
};

/** Trophy grade colours */
export const TrophyColors = {
  platinum: { light: "#B0C4DE", dark: PS_COLORS.trophy.platinum },
  gold: { light: "#D4AF37", dark: PS_COLORS.trophy.gold },
  silver: { light: "#A8A9AD", dark: PS_COLORS.trophy.silver },
  bronze: { light: "#CD7F32", dark: PS_COLORS.trophy.bronze },
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
