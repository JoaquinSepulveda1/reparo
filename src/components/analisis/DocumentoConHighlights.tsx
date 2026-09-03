"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { textoDeReemplazo, type Segment } from "@/lib/contrato/matching";
import { riskStyle, colors } from "@/lib/design/tokens";
import { cn } from "@/components/ui/cn";
import { HojaDoc } from "./HojaDoc";
import type { Finding } from "@/lib/api";

interface Props {
  segmentosPagina: Segment<Finding>[][];
  activeIndex: number | null;
  appliedMap: Record<number, boolean>;
  docMode: "original" | "edited";
  page: number;
  onPageChange: (p: number) => void;
  onMarkClick: (idx: number) => void;
  onToggleApplied: (idx: number) => void;
  markRefs: React.MutableRefObject<Record<number, HTMLElement | null>>;
}

type Tip = { text: string; x: number; y: number };
type Pop = { idx: number; x: number; y: number; text: string };

const TIP_WIDTH = 300;
const POP_WIDTH = 288;
const rank = { bajo: 1, medio: 2, alto: 3 } as const;

export function DocumentoConHighlights({
  segmentosPagina,
  activeIndex,
  appliedMap,
  docMode,
  page,
  onPageChange,
  onMarkClick,
  onToggleApplied,
  markRefs,
}: Props) {
  const [tip, setTip] = useState<Tip | null>(null);
  const [pop, setPop] = useState<Pop | null>(null);

  const total = segmentosPagina.length;
  const actual = Math.min(page, total - 1);
  const segments = segmentosPagina[actual] ?? [];

  const miniaturas = useMemo(
    () => segmentosPagina.map((segs) => segs.map((s) => s.content).join("")),
    [segmentosPagina],
  );

  const riesgoPagina = segmentosPagina.map((segs) => {
    let peor: "alto" | "medio" | "bajo" | null = null;
    for (const s of segs) {
      if (s.type !== "hl") continue;
      const n = s.f.nivel_riesgo ?? "medio";
      if (!peor || rank[n] > rank[peor]) peor = n;
    }
    return peor;
  });

  useEffect(() => {
    if (!pop) return;
    const close = () => setPop(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPop(null);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [pop]);

  const place = (e: React.MouseEvent, text: string) =>
    setTip({
      text,
      x: Math.min(e.clientX + 16, window.innerWidth - TIP_WIDTH - 12),
      y: Math.min(e.clientY + 16, window.innerHeight - 120),
    });

  function openPop(e: React.MouseEvent, idx: number, text: string) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTip(null);
    setPop({
      idx,
      text,
      x: Math.max(12, Math.min(r.left, window.innerWidth - POP_WIDTH - 12)),
      y: Math.min(r.bottom + 8, window.innerHeight - 180),
    });
    onMarkClick(idx);
  }

  return (
    <>
      <HojaDoc
        page={actual}
        total={total}
        onPageChange={onPageChange}
        riesgoPagina={riesgoPagina}
        miniaturas={miniaturas}
      >
        {segments.map((seg, i) => {
          if (seg.type === "text") return <span key={i}>{seg.content}</span>;

          const rs = riskStyle[seg.f.nivel_riesgo ?? "medio"] ?? riskStyle.medio;
          const isApplied = !!appliedMap[seg.idx];

          if (docMode === "edited" && isApplied) {
            return (
              <span
                key={i}
                onMouseEnter={(e) => place(e, seg.f.sugerencia)}
                onMouseMove={(e) => place(e, seg.f.sugerencia)}
                onMouseLeave={() => setTip(null)}
                className="cursor-help font-semibold underline decoration-line-strong decoration-[1.5px] underline-offset-2"
                style={{ color: colors.ink.DEFAULT }}
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
              onClick={(e) => openPop(e, seg.idx, seg.f.sugerencia)}
              onMouseEnter={(e) => place(e, seg.f.sugerencia)}
              onMouseMove={(e) => place(e, seg.f.sugerencia)}
              onMouseLeave={() => setTip(null)}
              className="cursor-pointer rounded-sharp px-[3px] py-[1px] transition-[background-color,color] duration-200"
              style={{
                background: active ? rs.color : rs.bg,
                color: active ? "var(--paper-raised)" : "inherit",
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
      </HojaDoc>

      {/* Tip de hover (rápido, sin acciones) */}
      {tip && !pop && (
        <div
          className="pointer-events-none fixed z-[60] rounded border border-line bg-ink px-3 py-2 text-paper shadow-lg"
          style={{ left: tip.x, top: tip.y, width: TIP_WIDTH }}
        >
          <span className="font-mono text-[9px] uppercase tracking-eyebrow text-accent">
            Sugerencia
          </span>
          <p className="mt-1 font-sans text-[12px] leading-snug">{tip.text}</p>
        </div>
      )}

      {/* Popover anclado (con acciones) */}
      <AnimatePresence>
        {pop && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="glass fixed z-[70] rounded-lg border p-3 shadow-lg"
            style={{ left: pop.x, top: pop.y, width: POP_WIDTH }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="font-mono text-[9px] uppercase tracking-eyebrow text-accent">
              Sugerencia
            </span>
            <p className="mb-2.5 mt-1 text-[12.5px] leading-snug text-ink">{pop.text}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleApplied(pop.idx)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.04em] transition-colors",
                  appliedMap[pop.idx]
                    ? "border-transparent text-paper"
                    : "border-line-strong text-ink-3 hover:border-ink hover:text-ink",
                )}
                style={appliedMap[pop.idx] ? { background: colors.brass.DEFAULT } : undefined}
              >
                <Check size={11} strokeWidth={3} />
                {appliedMap[pop.idx] ? "Aplicado" : "Aplicar"}
              </button>
              <button
                onClick={() => {
                  onMarkClick(pop.idx);
                  setPop(null);
                }}
                className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.04em] text-ink-3 transition-colors hover:text-ink"
              >
                Ver el detalle <ArrowRight size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
