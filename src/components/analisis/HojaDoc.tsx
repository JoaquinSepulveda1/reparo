"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { colors, riskStyle } from "@/lib/design/tokens";

type Riesgo = "alto" | "medio" | "bajo";

interface Props {
  page: number;
  total: number;
  onPageChange: (p: number) => void;
  /** Peor riesgo por página; pinta los puntos del navegador. Opcional. */
  riesgoPagina?: (Riesgo | null)[];
  /** Contenido de la página actual. */
  children: React.ReactNode;
  /** `compact` = tipografía y márgenes más chicos (modal, biblioteca). */
  size?: "normal" | "compact";
  /** Ref al contenedor scrolleable de la hoja (para hacer scrollIntoView). */
  scrollRef?: React.Ref<HTMLDivElement>;
  className?: string;
}

/**
 * "Hoja" de documento estilo procesador de texto: papel claro centrado, con
 * márgenes anchos y una medida de línea cómoda. Debajo, el navegador de páginas
 * (anterior / puntos / siguiente). Es solo presentación; el contenido de cada
 * página lo arma quien la usa.
 */
export function HojaDoc({
  page,
  total,
  onPageChange,
  riesgoPagina,
  children,
  size = "normal",
  scrollRef,
  className = "",
}: Props) {
  const actual = Math.min(Math.max(page, 0), total - 1);
  const compact = size === "compact";

  const irA = (p: number) => onPageChange(Math.min(Math.max(p, 0), total - 1));

  return (
    <div className={className}>
      <div
        ref={scrollRef}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); irA(actual + 1); }
          if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); irA(actual - 1); }
        }}
        className={`overflow-y-auto rounded-[2px] border border-line bg-paper-raised shadow-doc outline-none ${
          compact
            ? "max-h-[46vh] px-6 py-8 text-[13.5px] leading-[1.75] md:px-9 md:py-10"
            : "max-h-[68vh] min-h-[440px] px-7 py-10 text-[15px] leading-[1.85] md:px-14 md:py-16"
        } whitespace-pre-wrap font-serif text-ink-2`}
      >
        <div className={compact ? "" : "mx-auto max-w-[74ch]"}>{children}</div>

        {total > 1 && (
          <p
            className={`${
              compact ? "mt-6" : "mx-auto mt-10 max-w-[74ch]"
            } text-center font-mono text-[10px] tracking-eyebrow text-ink-3`}
          >
            — {actual + 1} —
          </p>
        )}
      </div>

      {total > 1 && (
        <>
          <div className="mt-2.5 flex items-center justify-between gap-3">
            <button
              onClick={() => irA(actual - 1)}
              disabled={actual === 0}
              className="flex items-center gap-1 font-mono text-[11px] text-ink-3 transition-colors hover:text-ink disabled:opacity-30 disabled:hover:text-ink-3"
            >
              <ChevronLeft size={13} /> anterior
            </button>

            {total <= 24 && (
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {Array.from({ length: total }, (_, p) => {
                  const r = riesgoPagina?.[p] ?? null;
                  return (
                    <button
                      key={p}
                      onClick={() => irA(p)}
                      aria-label={`Ir a la página ${p + 1}`}
                      className="h-2 w-2 rounded-full border transition-transform hover:scale-125"
                      style={{
                        background:
                          p === actual
                            ? colors.ink.DEFAULT
                            : r
                              ? riskStyle[r].color
                              : "transparent",
                        borderColor: p === actual ? colors.ink.DEFAULT : colors.line,
                      }}
                    />
                  );
                })}
              </div>
            )}

            <button
              onClick={() => irA(actual + 1)}
              disabled={actual >= total - 1}
              className="flex items-center gap-1 font-mono text-[11px] text-ink-3 transition-colors hover:text-ink disabled:opacity-30 disabled:hover:text-ink-3"
            >
              siguiente <ChevronRight size={13} />
            </button>
          </div>
          <p className="mt-1 text-center font-mono text-[10px] text-ink-3">
            página {actual + 1} de {total}
          </p>
        </>
      )}
    </div>
  );
}
