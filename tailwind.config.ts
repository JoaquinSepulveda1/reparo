import type { Config } from "tailwindcss";
import { colors, radius } from "./src/lib/design/tokens";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: colors.paper,
        ink: colors.ink,
        redline: colors.redline,
        brass: colors.brass,
        accent: colors.accent,
        line: {
          DEFAULT: colors.line,
          strong: "var(--line-strong)",
        },
      },
      fontFamily: {
        // Cargadas con next/font en src/app/layout.tsx → exponen estas CSS vars.
        serif: ["var(--font-spectral)", "Spectral", "Georgia", "serif"],
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "IBM Plex Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        none: "0px",
        sharp: radius.sharp, // hoja del documento + highlights (papel)
        sm: "4px",
        DEFAULT: radius.base, // botones / inputs / tarjetas
        md: "10px",
        lg: radius.lg, // paneles / modal
        xl: "20px",
        full: radius.full,
      },
      letterSpacing: {
        eyebrow: "0.11em",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-md)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        paper: "var(--shadow-paper)", // el "papel" (hard offset), legacy
        doc: "var(--shadow-paper)", // alias legacy — no romper usos existentes
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      backdropBlur: {
        glass: "14px",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-160% 0" },
          "100%": { backgroundPosition: "260% 0" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s linear infinite",
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
