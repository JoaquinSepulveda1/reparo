"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { textoDeReemplazo, type Segment } from "@/lib/contrato/matching";
import { riskStyle, colors } from "@/lib/design/tokens";
import type { Finding } from "@/lib/api";

interface Props {
  /** Segmentos del contrato ya repartidos por página. */
  segmentosPagina: Segment<Finding>[][];
  activeIndex: number | null;
  appliedMap: Record<number, boolean>;
  docMode: "original" | "edited";
  page: number;
  onPageChange: (p: number) => void;
  onMarkClick: (idx: number) => void;
  markRefs: React.MutableRefObject<Record<number, HTMLElement | null>>;
}

type Tip = { text: string; x: number; y: number };

const TIP_WIDTH = 300;

export function DocumentoConHighlights({
  segmentosPagina,
  activeIndex,
  appliedMap,
  docMode,
  page,
  onPageChange,
  onMarkClick,
  markRefs,
}: Props) {
  const [tip, setTip] = useState<Tip | null>(null);

  const total = segmentosPagina.length;
  const actual = Math.min(page, total - 1);
  const segments = segmentosPagina[actual] ?? [];

  // Riesgo máximo por página, para pintar los puntos del navegador.
  const rank = { bajo: 1, medio: 2, alto: 3 } as const;
  const riesgoPagina = segmentosPagina.map((segs) => {
    let peor: "alto" | "medio" | "bajo" | null = null;
    for (const s of segs) {
      if (s.type !== "hl") continue;
      const n = s.f.nivel_riesgo ?? "medio";
      if (!peor || rank[n] > rank[peor]) peor = n;
    }
    return peor;
  });

  const place = (e: React.MouseEvent, text: string) =>
    setTip({
      text,
      x: Math.min(e.clientX + 16, window.innerWidth - TIP_WIDTH - 12),
      y: Math.min(e.clientY + 16, window.innerHeight - 120),
    });

  return (
    <div>
      <div className="max-h-[620px] min-h-[480px] overflow-y-auto whitespace-pre-wrap border border-line bg-paper-raised px-7 py-9 font-serif text-[14px] leading-[1.75] text-ink-2 shadow-doc md:px-10 md:py-11">
        {segments.map((seg, i) => {
          if (seg.type === "text") return <span key={i}>{seg.content}</span>;

          const rs = riskStyle[seg.f.nivel_riesgo ?? "medio"] ?? riskStyle.medio;
          const isApplied = !!appliedMap[seg.idx];

          if (docMode === "edited" && isApplied) {
            // Texto nuevo ya integrado al contrato: azul tinta, negrita.
            return (
              <span
                key={i}
                onMouseEnter={(e) => place(e, seg.f.sugerencia)}
                onMouseMove={(e) => place(e, seg.f.sugerencia)}
                onMouseLeave={() => setTip(null)}
                className="cursor-help font-bold underline"
                style={{
                  color: colors.ink.DEFAULT,
                  textDecorationColor: colors.line,
                  textDecorationThickness: "1.5px",
                }}
              >
                {textoDeReemplazo(seg.f)}
              </span>
            );
          }

          const active = activeIndex === seg.idx;
          return (
            <mark
              key={i}
              ref={(el) => {
                markRefs.current[seg.idx] = el;
              }}
              onClick={() => onMarkClick(seg.idx)}
              onMouseEnter={(e) => place(e, seg.f.sugerencia)}
              onMouseMove={(e) => place(e, seg.f.sugerencia)}
              onMouseLeave={() => setTip(null)}
              className="cursor-pointer rounded-[2px] px-[3px] py-[1px] transition-colors"
              style={{
                background: active ? rs.color : rs.bg,
                color: active ? colors.paper.DEFAULT : "inherit",
                fontWeight: active ? 600 : "inherit",
                borderBottom: `2px solid ${rs.color}`,
                boxDecorationBreak: "clone",
                WebkitBoxDecorationBreak: "clone",
              }}
            >
              {seg.content}
            </mark>
          );
        })}

        {total > 1 && (
          <span className="mt-8 block text-center font-mono text-[10px] tracking-eyebrow text-ink-3">
            — {actual + 1} —
          </span>
        )}
      </div>

      {total > 1 && (
        <div className="mt-2.5 flex items-center justify-between gap-3">
          <button
            onClick={() => onPageChange(actual - 1)}
            disabled={actual === 0}
            className="flex items-center gap-1 font-mono text-[11px] text-ink-3 transition-colors hover:text-ink disabled:opacity-30 disabled:hover:text-ink-3"
          >
            <ChevronLeft size={13} /> anterior
          </button>

          <div className="flex items-center gap-1.5">
            {riesgoPagina.map((r, p) => (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                aria-label={`Ir a la página ${p + 1}`}
                className="h-2 w-2 rounded-full border transition-transform hover:scale-125"
                style={{
                  background: p === actual ? colors.ink.DEFAULT : r ? riskStyle[r].color : "transparent",
                  borderColor: p === actual ? colors.ink.DEFAULT : colors.line,
                }}
              />
            ))}
          </div>

          <button
            onClick={() => onPageChange(actual + 1)}
            disabled={actual >= total - 1}
            className="flex items-center gap-1 font-mono text-[11px] text-ink-3 transition-colors hover:text-ink disabled:opacity-30 disabled:hover:text-ink-3"
          >
            siguiente <ChevronRight size={13} />
          </button>
        </div>
      )}

      {total > 1 && (
        <p className="mt-1 text-center font-mono text-[10px] text-ink-3">
          página {actual + 1} de {total}
        </p>
      )}

      {tip && (
        <div
          className="pointer-events-none fixed z-[60] border border-line bg-ink px-3 py-2 text-paper shadow-doc"
          style={{ left: tip.x, top: tip.y, width: TIP_WIDTH }}
        >
          <span
            className="font-mono text-[9px] uppercase tracking-eyebrow"
            style={{ color: "#E7B7AE" }}
          >
            Sugerencia
          </span>
          <p className="mt-1 font-sans text-[12px] leading-snug">{tip.text}</p>
        </div>
      )}
    </div>
  );
}
