"use client";

import { forwardRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { riskStyle, colors } from "@/lib/design/tokens";
import { cn } from "@/components/ui/cn";
import type { Finding } from "@/lib/api";

interface Props {
  finding: Finding;
  index: number;
  active: boolean;
  hasMatch: boolean;
  applied: boolean;
  onSelect: () => void;
  onToggleApplied: () => void;
}

export const FindingCard = forwardRef<HTMLDivElement, Props>(function FindingCard(
  { finding, index, active, hasMatch, applied, onSelect, onToggleApplied },
  ref,
) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const rs = riskStyle[finding.nivel_riesgo] ?? riskStyle.medio;
  const tieneRedaccion =
    finding.nueva_redaccion && finding.nueva_redaccion.trim() !== finding.excerpt.trim();

  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1], delay: Math.min(index * 0.04, 0.32) }}
    >
      <Card
        ref={ref}
        accent={rs.color}
        accentGlow={rs.glow}
        active={active}
        onClick={onSelect}
        style={{
          background: active ? rs.bg : undefined,
          cursor: hasMatch ? "pointer" : "default",
        }}
        className={cn("!p-4", active && "scale-[1.01]")}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <span
            className="tabnums font-mono text-[10px] font-medium uppercase tracking-[0.05em]"
            style={{ color: rs.color }}
          >
            {rs.label} · {finding.score_riesgo}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.04em] text-ink-3">
            {finding.categoria}
          </span>
        </div>

        <p className="mb-2 text-[13.5px] leading-snug text-ink">{finding.problema}</p>

        <p className="mb-2.5 text-[12.5px] leading-snug text-ink-2">
          <span
            className="font-mono text-[10px] uppercase tracking-[0.04em]"
            style={{ color: colors.brass.DEFAULT }}
          >
            Sugerencia:{" "}
          </span>
          {finding.sugerencia}
        </p>

        {tieneRedaccion && (
          <div className="mb-2.5 rounded border-l-2 border-line-strong bg-paper-2 py-1.5 pl-2.5 pr-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.04em] text-ink-3">
              Queda redactado así
            </span>
            <p className="mt-0.5 text-[12.5px] font-medium leading-snug text-ink">
              {finding.nueva_redaccion}
            </p>
          </div>
        )}

        {!hasMatch && (
          <p className="mb-2 font-mono text-[10px] text-ink-3">
            No pude ubicar este fragmento en el documento.
          </p>
        )}

        <div className="flex items-center justify-between gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleApplied();
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.04em] transition-all duration-150",
              applied
                ? "border-transparent text-paper"
                : "border-line-strong text-ink-3 hover:border-ink hover:text-ink",
            )}
            style={applied ? { background: colors.brass.DEFAULT } : undefined}
          >
            <motion.span
              key={applied ? "on" : "off"}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
              className="grid place-items-center"
            >
              <Check size={11} strokeWidth={3} />
            </motion.span>
            {applied ? "Cambio aplicado" : "Aplicar cambio"}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen((o) => !o);
            }}
            className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.04em] text-ink-3 transition-colors hover:text-ink"
          >
            Ver detalle
            <ChevronDown
              size={12}
              className={cn("transition-transform duration-200", open && "rotate-180")}
            />
          </button>
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-3 border-t border-line pt-3">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-eyebrow text-ink-3">
                  Nivel de riesgo estimado
                </p>
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${finding.score_riesgo}%`, background: rs.color }}
                    />
                  </div>
                  <span className="tabnums font-mono text-[11px]" style={{ color: rs.color }}>
                    {finding.score_riesgo}/100
                  </span>
                </div>
                <p className="mb-1 font-mono text-[10px] uppercase tracking-eyebrow text-ink-3">
                  Fragmento señalado
                </p>
                <p className="font-serif text-[12.5px] leading-relaxed text-ink-2">
                  &ldquo;{finding.excerpt}&rdquo;
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
});
