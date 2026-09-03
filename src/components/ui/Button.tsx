import { forwardRef } from "react";
import { cn } from "./cn";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "toggle";
type Size = "md" | "sm";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  active?: boolean; // para variant="toggle"
  loading?: boolean;
}

const base =
  "relative inline-flex items-center justify-center gap-2 font-mono uppercase tracking-[0.045em] " +
  "rounded transition-all duration-150 ease-out-expo select-none " +
  "disabled:cursor-not-allowed disabled:opacity-55 " +
  "active:translate-y-0 active:scale-[0.985]";

const variants: Record<Variant, string> = {
  // CTA principal: fondo ink, hover acento, leve elevación.
  primary:
    "bg-ink text-paper shadow-sm hover:-translate-y-px hover:bg-accent hover:shadow-md " +
    "disabled:bg-line disabled:text-paper disabled:shadow-none disabled:translate-y-0",
  secondary:
    "border border-line-strong bg-transparent text-ink hover:-translate-y-px hover:border-ink hover:bg-paper-raised",
  ghost: "px-0 pb-0.5 text-ink-2 hover:text-accent rounded-none border-b border-line",
  danger:
    "border border-line bg-transparent text-ink-3 hover:border-redline hover:text-redline",
  toggle: "",
};

const sizes: Record<Size, string> = {
  md: "text-[12.5px] px-6 py-3.5",
  sm: "text-[11px] px-3 py-1.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", active = false, loading = false, className, children, disabled, ...props },
  ref,
) {
  const toggleCls =
    variant === "toggle"
      ? active
        ? "bg-ink text-paper shadow-sm"
        : "bg-paper-raised text-ink-3 hover:text-ink"
      : "";

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        base,
        variant !== "ghost" && sizes[size],
        variants[variant],
        toggleCls,
        className,
      )}
      {...props}
    >
      {loading && <Spinner size={size === "sm" ? 12 : 14} className="text-current" />}
      <span className={cn(loading && "opacity-90")}>{children}</span>
    </button>
  );
});
