import { cn } from "./cn";
import { riskStyle, type NivelRiesgo } from "@/lib/design/tokens";

type Tone = "neutral" | "accent" | "redline" | "brass";
type Variant = "soft" | "outline" | "plain";

export interface BadgeProps {
  children: React.ReactNode;
  tone?: Tone;
  variant?: Variant;
  /** Si se pasa, gana sobre `tone` y toma el color del nivel de riesgo. */
  riesgo?: NivelRiesgo;
  className?: string;
}

const toneVar: Record<Tone, { fg: string; bg: string }> = {
  neutral: { fg: "var(--ink-3)", bg: "var(--ink2-soft)" },
  accent: { fg: "var(--accent)", bg: "var(--accent-soft)" },
  redline: { fg: "var(--redline)", bg: "var(--redline-soft)" },
  brass: { fg: "var(--brass)", bg: "var(--brass-soft)" },
};

export function Badge({ children, tone = "neutral", variant = "plain", riesgo, className }: BadgeProps) {
  const c = riesgo
    ? { fg: riskStyle[riesgo].color, bg: riskStyle[riesgo].bg }
    : toneVar[tone];

  const style: React.CSSProperties = { color: c.fg };
  if (variant === "soft") style.background = c.bg;
  if (variant === "outline") style.boxShadow = `inset 0 0 0 1px ${c.fg}`;

  return (
    <span
      style={style}
      className={cn(
        "tabnums inline-flex items-center gap-1 font-mono text-[10px] font-medium uppercase tracking-[0.05em]",
        variant !== "plain" && "rounded-full px-2 py-0.5",
        className,
      )}
    >
      {children}
    </span>
  );
}
