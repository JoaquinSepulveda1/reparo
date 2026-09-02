import { forwardRef } from "react";
import { cn } from "./cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Barra de color a la izquierda (findings activos, riesgo, etc.). */
  accent?: string;
  active?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { accent, active = false, className, style, children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      style={{
        ...(accent ? { borderLeftColor: accent, borderLeftWidth: 2.5 } : {}),
        ...style,
      }}
      className={cn(
        "bg-paper-raised border border-line p-4 transition-colors",
        active && "border-ink",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});
