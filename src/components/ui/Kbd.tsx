import { cn } from "./cn";

/** Keycap para hints de teclado (navegación de findings, ⌘K). */
export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex min-w-[1.4em] items-center justify-center rounded-sm border border-line-strong",
        "bg-paper-raised px-1.5 py-0.5 font-mono text-[10px] font-medium leading-none text-ink-2 shadow-sm",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
