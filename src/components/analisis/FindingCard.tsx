"use client";

import { forwardRef } from "react";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { riskStyle } from "@/lib/design/tokens";
import { colors } from "@/lib/design/tokens";
import type { Finding } from "@/lib/api";

interface Props {
  finding: Finding;
  active: boolean;
  hasMatch: boolean;
  applied: boolean;
  onSelect: () => void;
  onToggleApplied: () => void;
}

export const FindingCard = forwardRef<HTMLDivElement, Props>(function FindingCard(
  { finding, active, hasMatch, applied, onSelect, onToggleApplied },
  ref,
) {
  const rs = riskStyle[finding.nivel_riesgo] ?? riskStyle.medio;

  return (
    <Card
      ref={ref}
      accent={rs.color}
      active={active}
      onClick={onSelect}
      style={{
        background: active ? rs.bg : undefined,
        borderColor: active ? rs.color : undefined,
        cursor: hasMatch ? "pointer" : "default",
      }}
      className="!p-4"
    >
      <div className="mb-2 flex items-center justify-between">
        <span
          className="font-mono text-[10px] font-medium uppercase tracking-[0.05em]"
          style={{ color: rs.color }}
        >
          {rs.label} · {finding.score_riesgo}
        </span>
        <span className="font-mono text-[10px] uppercase text-ink-3">{finding.categoria}</span>
      </div>

      <p className="mb-2 text-[13.5px] text-ink">{finding.problema}</p>

      <p className="mb-2 text-[12.5px] text-ink-2">
        <span className="font-mono text-[10.5px] uppercase" style={{ color: colors.brass.DEFAULT }}>
          Sugerencia:{" "}
        </span>
        {finding.sugerencia}
      </p>

      {finding.nueva_redaccion && finding.nueva_redaccion.trim() !== finding.excerpt.trim() && (
        <div className="mb-2.5 border-l-2 border-line pl-2.5">
          <span className="font-mono text-[10px] uppercase text-ink-3">Queda redactado así:</span>
          <p className="mt-0.5 text-[12.5px] font-medium text-ink">{finding.nueva_redaccion}</p>
        </div>
      )}

      {!hasMatch && (
        <p className="mb-2 font-mono text-[10px] text-ink-3">
          No pude ubicar este fragmento en el documento.
        </p>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleApplied();
        }}
        className="inline-flex items-center gap-1 rounded-[2px] border px-2.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.04em] transition-colors"
        style={{
          borderColor: applied ? colors.brass.DEFAULT : colors.line,
          background: applied ? colors.brass.DEFAULT : "transparent",
          color: applied ? colors.paper.DEFAULT : colors.ink[3],
        }}
      >
        <Check size={11} /> {applied ? "Cambio aplicado" : "Aplicar cambio"}
      </button>
    </Card>
  );
});
