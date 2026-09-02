import type { Config } from "tailwindcss";
import { colors, radius } from "./src/lib/design/tokens";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: colors.paper,
        ink: colors.ink,
        redline: colors.redline,
        brass: colors.brass,
        line: colors.line,
      },
      fontFamily: {
        // Cargadas con next/font en src/app/layout.tsx → exponen estas CSS vars.
        serif: ["var(--font-spectral)", "Spectral", "Georgia", "serif"],
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "IBM Plex Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        DEFAULT: radius,
        sm: radius,
      },
      letterSpacing: {
        eyebrow: "0.08em", // labels / eyebrows en mono mayúscula
      },
      boxShadow: {
        doc: "6px 6px 0 rgba(27,42,74,0.06)", // el "papel" de la landing
      },
    },
  },
  plugins: [],
};

export default config;
