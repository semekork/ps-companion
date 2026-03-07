/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./features/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // PlayStation brand
        "ps-blue": {
          DEFAULT: "#00439C",
          dark: "#0070D1",
        },
        "ps-accent": {
          DEFAULT: "#0070D1",
          dark: "#4DA6FF",
        },
        // Trophy grades
        "trophy-platinum": {
          DEFAULT: "#B0C4DE",
          dark: "#C8D8E8",
        },
        "trophy-gold": {
          DEFAULT: "#D4AF37",
          dark: "#FFD700",
        },
        "trophy-silver": {
          DEFAULT: "#A8A9AD",
          dark: "#C0C0C0",
        },
        "trophy-bronze": {
          DEFAULT: "#CD7F32",
          dark: "#E8956D",
        },
        // UI surfaces
        surface: {
          DEFAULT: "#FFFFFF",
          dark: "#1C1C1E",
        },
        "surface-elevated": {
          DEFAULT: "#F2F2F7",
          dark: "#2C2C2E",
        },
      },
    },
  },
  plugins: [],
};
