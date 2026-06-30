import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{js,ts,jsx,tsx,mdx,json}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#009B77",
          50: "#E6F7F3",
          100: "#CCEFE7",
          200: "#99DFD0",
          300: "#66CFB9",
          400: "#33BFA2",
          500: "#009B77",
          600: "#007C5F",
          700: "#005D47",
          800: "#003E2F",
          900: "#001F18",
        },
        secondary: {
          DEFAULT: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#D62612",
          50: "#FCEAE8",
          100: "#F9D5D0",
          200: "#F3ABA1",
          300: "#ED8172",
          400: "#E75743",
          500: "#D62612",
          600: "#AB1E0E",
          700: "#80170B",
          800: "#560F07",
          900: "#2B0804",
        },
        muted: "#6B7280",
        card: "#FFFFFF",
        success: "#10B981",
        danger: "#EF4444",
        warning: "#F59E0B",
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans", "Noto Sans Cyrillic", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
