/**
 * PlayStation Brand Colors
 */
export const PS_COLORS = {
  // Primary brand blues
  blue: "#0070D1",
  darkBlue: "#00439C",
  deepBlue: "#001A3A",

  // Accents
  accentBlue: "#4DA6FF",
  psPlus: "#F9AA00",

  // Trophies
  trophy: {
    platinum: "#C8D8E8",
    gold: "#FFD700",
    silver: "#C0C0C0",
    bronze: "#E8956D",
  },
};

/**
 * Common Gradients
 */
export const GRADIENTS = {
  primary: [PS_COLORS.blue, PS_COLORS.darkBlue] as const,
  dark: [PS_COLORS.deepBlue, "#000918", "#000000"] as const,
};
