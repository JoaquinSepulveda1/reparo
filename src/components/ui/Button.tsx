import { forwardRef } from "react";
import { cn } from "./cn";

type Variant = "primary" | "ghost" | "toggle";
type Size = "md" | "sm";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  active?: boolean; // para variant="toggle"
}

const base =
  "inline-flex items-center justify-center gap-2 font-mono uppercase tracking-[0.05em] " +
  "rounded transition-colors disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<Variant, string> = {
  // CTA principal: fondo ink, hover redline (igual que .btn-primary de la landing).
  primary: "bg-ink text-paper hover:bg-redline disabled:bg-line disabled:text-paper",
  ghost: "text-ink-2 hover:text-redline border-b border-line rounded-none px-0 pb-0.5",
  toggle: "",
};

const sizes: Record<Size, string> = {
  md: "text-[13px] px-6 py-3.5",
  sm: "text-[11px] px-2.5 py-1.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", active = false, className, ...props },
  ref,
) {
  const toggleCls =
    variant === "toggle"
      ? active
        ? "bg-ink text-paper"
        : "bg-paper-raised text-ink-3 hover:text-ink"
      : "";

  return (
    <button
      ref={ref}
      className={cn(
        base,
        variant !== "ghost" && sizes[size],
        variants[variant],
        toggleCls,
        className,
      )}
      {...props}
    />
  );
});
