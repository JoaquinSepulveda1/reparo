import { cn } from "./cn";

/** Bloque de carga. Usa el shimmer de la marca. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("rounded bg-line", className)}
      style={{
        backgroundImage:
          "linear-gradient(100deg, transparent 30%, var(--paper-raised) 50%, transparent 70%)",
        backgroundSize: "220% 100%",
        animation: "reparo-shimmer 1.6s linear infinite",
      }}
    />
  );
}
