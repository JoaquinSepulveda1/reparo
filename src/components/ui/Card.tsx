import { forwardRef } from "react";
import { cn } from "./cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Barra de color a la izquierda (findings activos, riesgo, etc.). */
  accent?: string;
  /** Aura del rail cuando `active` (glow del riesgo). */
  accentGlow?: string;
  active?: boolean;
  /** Hover-lift + sombra al pasar el mouse (tarjetas clickeables). */
  interactive?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { accent, accentGlow, active = false, interactive = false, className, style, children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      style={{
        ...(accent
          ? {
              borderLeftColor: accent,
              borderLeftWidth: 3,
              boxShadow: active && accentGlow ? `-10px 0 24px -14px ${accentGlow}` : undefined,
            }
          : {}),
        ...style,
      }}
      className={cn(
        "rounded-lg border border-line bg-paper-raised p-4 shadow-sm transition-all duration-200 ease-out-expo",
        interactive &&
          "cursor-pointer hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lg",
        active && "border-line-strong shadow-md",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});
