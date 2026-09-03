"use client";

import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { riskStyle } from "@/lib/design/tokens";
import { cn } from "@/components/ui/cn";

type Riesgo = "alto" | "medio" | "bajo";

interface Props {
  page: number;
  total: number;
  onPageChange: (p: number) => void;
  /** Peor riesgo por página; tiñe miniaturas y navegador. Opcional. */
  riesgoPagina?: (Riesgo | null)[];
  /** Texto plano por página → habilita el riel de miniaturas tipo Adobe. */
  miniaturas?: string[];
  children: React.ReactNode;
  /** `compact` = tipografía y márgenes más chicos (modal, biblioteca). */
  size?: "normal" | "compact";
  scrollRef?: React.Ref<HTMLDivElement>;
  className?: string;
}

// Proporción tipo A4 (alto / ancho) para las miniaturas.
const A4 = 1.294;

/**
 * "Hoja" de documento estilo procesador de texto. Si se pasan `miniaturas`,
 * muestra a la izquierda un riel de páginas en miniatura (navegación no lineal:
 * saltar de la 1 a la 7 o de la 5 a la 2). Si no, cae a un navegador de puntos.
 */
export function HojaDoc({
  page,
  total,
  onPageChange,
  riesgoPagina,
  miniaturas,
  children,
  size = "normal",
  scrollRef,
  className = "",
}: Props) {
  const actual = Math.min(Math.max(page, 0), total - 1);
  const compact = size === "compact";
  const irA = (p: number) => onPageChange(Math.min(Math.max(p, 0), total - 1));

  const conRiel = !!miniaturas && miniaturas.length > 1;
  const thumbW = compact ? 66 : 92;
  const scale = thumbW / 640; // el contenido se renderiza a 640px y se escala

  const railRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (!conRiel) return;
    thumbRefs.current[actual]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [actual, conRiel]);

  const sheet = (
    <div className="min-w-0 flex-1">
      <div
        ref={scrollRef}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); irA(actual + 1); }
          if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); irA(actual - 1); }
        }}
        className={cn(
          "thin-scroll overflow-y-auto rounded-sharp border border-line bg-paper-raised shadow-paper outline-none",
          compact
            ? "max-h-[46vh] px-6 py-8 text-[13.5px] leading-[1.75] md:px-9 md:py-10"
            : "max-h-[68vh] min-h-[440px] px-7 py-10 text-[15px] leading-[1.85] md:px-14 md:py-16",
          "whitespace-pre-wrap font-serif text-ink-2",
        )}
      >
        <div className={compact ? "" : "mx-auto max-w-[74ch]"}>{children}</div>

        {total > 1 && (
          <p
            className={cn(
              compact ? "mt-6" : "mx-auto mt-10 max-w-[74ch]",
              "text-center font-mono text-[10px] tracking-eyebrow text-ink-3",
            )}
          >
            — {actual + 1} —
          </p>
        )}
      </div>

      {total > 1 && (
        <div className="mt-2.5 flex items-center gap-3">
          <button
            onClick={() => irA(actual - 1)}
            disabled={actual === 0}
            className="flex shrink-0 items-center gap-1 font-mono text-[10.5px] uppercase tracking-[0.04em] text-ink-3 transition-colors hover:text-ink disabled:opacity-30 disabled:hover:text-ink-3"
          >
            <ChevronLeft size={13} /> ant
          </button>

          {!conRiel && total <= 40 ? (
            <div className="flex flex-1 items-center gap-1">
              {Array.from({ length: total }, (_, p) => {
                const r = riesgoPagina?.[p] ?? null;
                const isCur = p === actual;
                return (
                  <button
                    key={p}
                    onClick={() => irA(p)}
                    aria-label={`Ir a la página ${p + 1}`}
                    title={`Página ${p + 1}`}
                    className="group h-4 flex-1 py-1.5"
                  >
                    <span
                      className={cn(
                        "block h-1 w-full rounded-full transition-all duration-200",
                        isCur ? "h-1.5" : "opacity-60 group-hover:opacity-100",
                      )}
                      style={{
                        background: isCur
                          ? "var(--ink)"
                          : r
                            ? riskStyle[r].color
                            : "var(--line-strong)",
                      }}
                    />
                  </button>
                );
              })}
            </div>
          ) : (
            <span className="tabnums flex-1 text-center font-mono text-[10.5px] text-ink-3">
              página {actual + 1} de {total}
            </span>
          )}

          <button
            onClick={() => irA(actual + 1)}
            disabled={actual >= total - 1}
            className="flex shrink-0 items-center gap-1 font-mono text-[10.5px] uppercase tracking-[0.04em] text-ink-3 transition-colors hover:text-ink disabled:opacity-30 disabled:hover:text-ink-3"
          >
            sig <ChevronRight size={13} />
          </button>
        </div>
      )}
    </div>
  );

  if (!conRiel) return <div className={className}>{sheet}</div>;

  return (
    <div className={cn("flex gap-3", className)}>
      {/* Riel de miniaturas (oculto en móvil) */}
      <div
        ref={railRef}
        className="thin-scroll hidden shrink-0 overflow-y-auto pr-1 md:block"
        style={{ width: thumbW + 14, maxHeight: compact ? "46vh" : "68vh" }}
      >
        <div className="flex flex-col items-center gap-2">
          {miniaturas!.map((txt, p) => {
            const isCur = p === actual;
            const r = riesgoPagina?.[p] ?? null;
            return (
              <button
                key={p}
                ref={(el) => {
                  thumbRefs.current[p] = el;
                }}
                onClick={() => irA(p)}
                aria-label={`Ir a la página ${p + 1}`}
                aria-current={isCur || undefined}
                className="group flex flex-col items-center gap-1"
              >
                <span
                  className={cn(
                    "relative block overflow-hidden rounded-sm border bg-paper-raised transition-all",
                    isCur
                      ? "border-accent ring-2 ring-accent"
                      : "border-line group-hover:border-line-strong",
                  )}
                  style={{ width: thumbW, height: Math.round(thumbW * A4) }}
                >
                  <span
                    aria-hidden
                    className="block whitespace-pre-wrap font-serif text-ink-2"
                    style={{
                      width: 640,
                      padding: "40px 44px",
                      fontSize: 13,
                      lineHeight: 1.5,
                      transform: `scale(${scale})`,
                      transformOrigin: "top left",
                    }}
                  >
                    {txt.slice(0, 1600)}
                  </span>
                  {r && (
                    <span
                      className="absolute inset-x-0 top-0 h-[3px]"
                      style={{ background: riskStyle[r].color }}
                    />
                  )}
                </span>
                <span
                  className={cn(
                    "tabnums font-mono text-[9px]",
                    isCur ? "font-semibold text-ink" : "text-ink-3",
                  )}
                >
                  {p + 1}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {sheet}
    </div>
  );
}
