"use client";

import { useState } from "react";

const TIP_WIDTH = 300;

/**
 * Envuelve un fragmento de texto inline y muestra un tooltip propio (instantáneo,
 * con la tipografía de la marca) al pasar el mouse. Reemplaza al `title` nativo,
 * que en varios navegadores no aparece.
 */
export function HoverTipText({
  tip,
  label = "Sugerencia",
  children,
  className,
  style,
}: {
  tip: string;
  label?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const move = (e: React.MouseEvent) =>
    setPos({
      x: Math.min(e.clientX + 16, window.innerWidth - TIP_WIDTH - 12),
      y: Math.min(e.clientY + 16, window.innerHeight - 120),
    });

  return (
    <>
      <span
        className={className}
        style={style}
        onMouseEnter={move}
        onMouseMove={move}
        onMouseLeave={() => setPos(null)}
      >
        {children}
      </span>
      {pos && (
        <span
          className="pointer-events-none fixed z-[60] block border border-line bg-ink px-3 py-2 text-paper shadow-lg"
          style={{ left: pos.x, top: pos.y, width: TIP_WIDTH }}
        >
          <span
            className="font-mono text-[9px] uppercase tracking-eyebrow"
            style={{ color: "#E7B7AE" }}
          >
            {label}
          </span>
          <span className="mt-1 block font-sans text-[12px] leading-snug">{tip}</span>
        </span>
      )}
    </>
  );
}
