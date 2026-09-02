/**
 * Fuente única de verdad del sistema de diseño "Reparo".
 * Extraído del prototipo (ContratoReview.jsx) y de la landing (reparo-chile.html).
 *
 * `tailwind.config.ts` importa `colors` de aquí, así que no se duplican los hex.
 * Para SVGs inline (el logo) o estilos que no pasan por Tailwind, importar desde
 * este archivo en vez de escribir el color a mano.
 */

export const colors = {
  paper: {
    DEFAULT: "#F1EEE4", // fondo base
    2: "#E9E4D6", // fondo alterno (bandas)
    raised: "#FBFAF6", // tarjetas / documento sobre el fondo
  },
  ink: {
    DEFAULT: "#1B2A4A", // texto principal / botones
    2: "#3D4A66", // texto secundario
    3: "#6B7280", // texto terciario / labels apagados
  },
  redline: {
    DEFAULT: "#B23A2E", // acento primario, riesgo alto
    soft: "rgba(178,58,46,0.14)", // fondo highlight riesgo alto
  },
  brass: {
    DEFAULT: "#8C6B2F", // riesgo medio / sugerencias aplicadas
    soft: "rgba(140,107,47,0.16)", // fondo highlight riesgo medio
  },
  line: "rgba(27,42,74,0.15)", // bordes / reglas
} as const;

/** Estilo por nivel de riesgo — replica RISK_STYLE del prototipo. */
export const riskStyle = {
  alto: { color: colors.redline.DEFAULT, bg: colors.redline.soft, label: "Riesgo alto" },
  medio: { color: colors.brass.DEFAULT, bg: colors.brass.soft, label: "Riesgo medio" },
  bajo: { color: colors.ink[2], bg: "rgba(61,74,102,0.10)", label: "Riesgo bajo" },
} as const;

export type NivelRiesgo = keyof typeof riskStyle;

/** Color de un score 0-100, igual que scoreColor() del prototipo. */
export function scoreColor(score: number): string {
  if (score >= 66) return colors.redline.DEFAULT;
  if (score >= 33) return colors.brass.DEFAULT;
  return colors.ink[2];
}

export const radius = "2px";
