/**
 * Fuente única de verdad del sistema de diseño "Reparo".
 *
 * El color vive en variables CSS (ver `src/app/globals.css`): `:root` define el
 * tema claro y `:root[data-theme="dark"]` el oscuro. Acá solo se referencian esas
 * variables, así que cualquier `style={{ color: colors.ink.DEFAULT }}` o clase de
 * Tailwind queda tematizada automáticamente.
 *
 * `tailwind.config.ts` importa `colors` de aquí. Para SVGs que necesiten un color
 * concreto (no `currentColor`), importar `INK_HEX` / `REDLINE_HEX`.
 */

const v = (name: string) => `var(--${name})`;

export const colors = {
  paper: {
    DEFAULT: v("paper"), // fondo base de la página
    2: v("paper-2"), // fondo alterno (bandas)
    raised: v("paper-raised"), // tarjetas / hoja del documento
  },
  ink: {
    DEFAULT: v("ink"), // texto principal / botones
    2: v("ink-2"), // texto secundario
    3: v("ink-3"), // texto terciario / labels apagados
  },
  redline: {
    DEFAULT: v("redline"), // riesgo alto
    soft: v("redline-soft"), // fondo highlight riesgo alto
    glow: v("redline-glow"), // aura / sombra riesgo alto
  },
  brass: {
    DEFAULT: v("brass"), // riesgo medio / sugerencias aplicadas
    soft: v("brass-soft"),
    glow: v("brass-glow"),
  },
  /** Acento de "inteligencia / IA". Independiente de la escala de riesgo. */
  accent: {
    DEFAULT: v("accent"),
    soft: v("accent-soft"),
    glow: v("accent-glow"),
  },
  line: v("line"), // hairlines / bordes
} as const;

/** Hex crudos para SVG que no puede usar `currentColor`. */
export const INK_HEX = "#1B2A4A";
export const REDLINE_HEX = "#B23A2E";

/** Estilo por nivel de riesgo — replica RISK_STYLE del prototipo. */
export const riskStyle = {
  alto: {
    color: colors.redline.DEFAULT,
    bg: colors.redline.soft,
    glow: colors.redline.glow,
    label: "Riesgo alto",
  },
  medio: {
    color: colors.brass.DEFAULT,
    bg: colors.brass.soft,
    glow: colors.brass.glow,
    label: "Riesgo medio",
  },
  bajo: {
    color: colors.ink[2],
    bg: v("ink2-soft"),
    glow: v("ink2-soft"),
    label: "Riesgo bajo",
  },
} as const;

export type NivelRiesgo = keyof typeof riskStyle;

/** Color de un score 0-100, igual que scoreColor() del prototipo. */
export function scoreColor(score: number): string {
  if (score >= 66) return colors.redline.DEFAULT;
  if (score >= 33) return colors.brass.DEFAULT;
  return colors.ink[2];
}

/** Aura del score ring, a juego con scoreColor(). */
export function scoreGlow(score: number): string {
  if (score >= 66) return colors.redline.glow;
  if (score >= 33) return colors.brass.glow;
  return v("ink2-soft");
}

/** Curvas y tiempos de animación. Usar con framer-motion o transiciones CSS. */
export const motion = {
  easeOut: [0.16, 1, 0.3, 1] as [number, number, number, number],
  spring: { type: "spring", stiffness: 420, damping: 34, mass: 0.9 } as const,
  springSoft: { type: "spring", stiffness: 260, damping: 30 } as const,
  dur: { fast: 0.15, base: 0.22, slow: 0.4 },
} as const;

/** Radios. `sharp` es para la hoja del documento y los highlights (papel). */
export const radius = {
  sharp: "2px",
  base: "8px",
  lg: "14px",
  full: "9999px",
} as const;
