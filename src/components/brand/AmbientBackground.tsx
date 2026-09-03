"use client";

import { useReducedMotion } from "framer-motion";
import { cn } from "@/components/ui/cn";

/**
 * Fondo ambiente: dos manchas de gradiente muy tenues que respiran lento.
 * Puramente decorativo (`aria-hidden`), detrás del contenido. Se apaga con
 * `prefers-reduced-motion`. Va dentro de un contenedor `relative`.
 */
export function AmbientBackground({ className }: { className?: string }) {
  const reduce = useReducedMotion();

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}
    >
      <div
        className="absolute -left-[10%] -top-[30%] h-[55vh] w-[55vh] rounded-full opacity-[0.5] blur-[90px]"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, var(--accent-glow), transparent 70%)",
          animation: reduce ? undefined : "reparo-aurora 26s ease-in-out infinite",
        }}
      />
      <div
        className="absolute -right-[8%] top-[8%] h-[42vh] w-[42vh] rounded-full opacity-[0.35] blur-[90px]"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, var(--redline-glow), transparent 70%)",
          animation: reduce ? undefined : "reparo-aurora 34s ease-in-out infinite reverse",
        }}
      />
    </div>
  );
}
