import { cn } from "./cn";
import { riskStyle, type NivelRiesgo } from "@/lib/design/tokens";

export interface BadgeProps {
  children: React.ReactNode;
  /** Tono semántico. Si se pasa `riesgo`, gana sobre `tone`. */
  tone?: "neutral" | "redline" | "brass";
  riesgo?: NivelRiesgo;
  className?: string;
}

const tones = {
  neutral: "text-ink-3",
  redline: "text-redline",
  brass: "text-brass",
} as const;

export function Badge({ children, tone = "neutral", riesgo, className }: BadgeProps) {
  const style = riesgo ? { color: riskStyle[riesgo].color } : undefined;
  return (
    <span
      style={style}
      className={cn(
        "font-mono text-[10px] uppercase tracking-[0.05em] font-medium",
        !riesgo && tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
