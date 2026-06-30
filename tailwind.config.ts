import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{json}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#2D6A4F",
          50: "#EDF5F0",
          100: "#D4EBDE",
          200: "#A9D7BD",
          300: "#7EC39C",
          400: "#53AF7B",
          500: "#2D6A4F",
          600: "#24553F",
          700: "#1B402F",
          800: "#122B1F",
          900: "#091510",
        },
        accent: {
          DEFAULT: "#B91C1C",
          50: "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          300: "#FCA5A5",
          400: "#F87171",
          500: "#B91C1C",
          600: "#991B1B",
          700: "#7F1D1D",
          800: "#631717",
          900: "#450A0A",
        },
        gold: {
          DEFAULT: "#D4A574",
          50: "#FBF6F0",
          100: "#F7EDE1",
          200: "#EFDBC3",
          300: "#E7C9A5",
          400: "#DFB787",
          500: "#D4A574",
          600: "#C08A4E",
          700: "#9E6E38",
          800: "#7A552B",
          900: "#563C1E",
        },
        warm: {
          50: "#FAF8F5",
          100: "#F5F0EB",
          200: "#EBE1D7",
          300: "#D6C8B8",
          400: "#B8A898",
          500: "#9C8B7A",
          600: "#7C6E60",
          700: "#5C5147",
          800: "#3D352E",
          900: "#1E1A16",
        },
        muted: "#78716C",
        card: "#FFFFFF",
        success: "#2D6A4F",
        danger: "#B91C1C",
        warning: "#D4A574",
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans", "Noto Sans Cyrillic", "system-ui", "sans-serif"],
        serif: ["Playfair Display", "Noto Serif", "Georgia", "serif"],
        cyrillic: ["Noto Serif", "Noto Sans Cyrillic", "serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
        "4xl": "1.5rem",
      },
      boxShadow: {
        card: "0 2px 12px rgba(45, 106, 79, 0.06)",
        "card-hover": "0 4px 20px rgba(45, 106, 79, 0.10)",
        nav: "0 -2px 12px rgba(0, 0, 0, 0.04)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(45, 106, 79, 0.4)" },
          "50%": { boxShadow: "0 0 0 12px rgba(45, 106, 79, 0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
