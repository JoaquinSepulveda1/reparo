"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, AlertTriangle, Sparkles } from "lucide-react";
import { ScoreRing } from "./ScoreRing";
import { DocumentoConHighlights } from "./DocumentoConHighlights";
import { FindingCard } from "./FindingCard";
import { PreviewGuardar } from "./PreviewGuardar";
import { Disclaimer } from "@/components/app/Disclaimer";
import { colors } from "@/lib/design/tokens";
import { buildSegments, buildEditedText, matchedIndices } from "@/lib/contrato/matching";
import { guardarContrato, ApiError, type AnalizarResponse } from "@/lib/api";

interface Props {
  resultado: AnalizarResponse;
  contractText: string;
  fileName: string;
  onReset: () => void;
}

export function Resultado({ resultado, contractText, fileName, onReset }: Props) {
  const { findings } = resultado;

  const [activeIndex, setActiveIndex] = useState<number | null>(
    findings.length ? 0 : null,
  );
  const [appliedMap, setAppliedMap] = useState<Record<number, boolean>>({});
  const [docMode, setDocMode] = useState<"original" | "edited">("original");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const router = useRouter();

  const markRefs = useRef<Record<number, HTMLElement | null>>({});
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const segments = useMemo(
    () => buildSegments(contractText, findings.map((f) => ({ ...f }))),
    [contractText, findings],
  );
  const matched = useMemo(() => matchedIndices(segments), [segments]);
  const editedText = useMemo(
    () => buildEditedText(segments, appliedMap),
    [segments, appliedMap],
  );
  const appliedCount = Object.values(appliedMap).filter(Boolean).length;

  function focusMark(idx: number) {
    setActiveIndex(idx);
    cardRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function focusCard(idx: number, hasMatch: boolean) {
    setActiveIndex(idx);
    if (hasMatch) markRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function toggleApplied(idx: number) {
    setAppliedMap((p) => ({ ...p, [idx]: !p[idx] }));
  }

  async function confirmarGuardar() {
    setSaving(true);
    setSaveError("");
    try {
      await guardarContrato({
        nombre_archivo: fileName || "Contrato pegado",
        texto_original: contractText,
        texto_editado: editedText,
        score_general: resultado.score_general,
        resumen: resultado.resumen,
        findings: findings.map((f, i) => ({ ...f, aplicada: !!appliedMap[i] })),
      });
      // No volver a la misma pantalla: se va a la biblioteca.
      router.push("/biblioteca");
    } catch (e) {
      setSaveError(e instanceof ApiError ? e.message : "No pude guardar. Intentá de nuevo.");
      setSaving(false);
    }
  }

  return (
    <div>
      <button
        onClick={onReset}
        className="mb-6 flex items-center gap-1 font-mono text-[12px] text-ink-3 hover:text-ink"
      >
        <ArrowLeft size={13} /> Analizar otro contrato
      </button>

      {/* Score */}
      <div className="mb-8 flex items-center gap-6 rounded-[2px] border border-line bg-paper-raised px-6 py-5">
        <ScoreRing score={resultado.score_general} />
        <div>
          <p className="mb-1 font-mono text-[11px] uppercase tracking-eyebrow text-ink-3">
            Puntaje de riesgo general
          </p>
          <p className="text-[14.5px] text-ink-2">{resultado.resumen}</p>
          {resultado.uso_precedentes && (
            <p className="mt-1.5 font-mono text-[10.5px] text-ink-3">
              informado con precedentes de análisis anteriores
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        {/* Documento */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-eyebrow text-ink-3">
              <FileText size={12} className="mr-1 inline" /> Documento
            </span>
            <div className="flex overflow-hidden rounded-[2px] border border-line">
              {(["original", "edited"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setDocMode(m)}
                  className="px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.04em] transition-colors"
                  style={{
                    background: docMode === m ? colors.ink.DEFAULT : colors.paper.raised,
                    color: docMode === m ? colors.paper.DEFAULT : colors.ink[3],
                  }}
                >
                  {m === "original" ? "Original" : "Con cambios"}
                </button>
              ))}
            </div>
          </div>
          <DocumentoConHighlights
            texto={contractText}
            findings={findings}
            activeIndex={activeIndex}
            appliedMap={appliedMap}
            docMode={docMode}
            onMarkClick={focusMark}
            markRefs={markRefs}
          />
        </div>

        {/* Findings */}
        <div>
          <p className="mb-2.5 font-mono text-[11px] uppercase tracking-eyebrow text-ink-3">
            <AlertTriangle size={12} className="mr-1 inline" /> Puntos a revisar ({findings.length})
          </p>
          <div className="flex max-h-[560px] flex-col gap-3 overflow-y-auto">
            {findings.map((f, i) => (
              <FindingCard
                key={i}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                finding={f}
                active={activeIndex === i}
                hasMatch={matched.has(i)}
                applied={!!appliedMap[i]}
                onSelect={() => focusCard(i, matched.has(i))}
                onToggleApplied={() => toggleApplied(i)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Guardar */}
      <div className="mt-8 flex items-center justify-between border-t border-line pt-5">
        <p className="max-w-[50ch] text-[12.5px] text-ink-3">
          <Sparkles size={12} className="mr-1 inline align-[-1px]" />
          Guardar este análisis lo agrega a la biblioteca de precedentes: la próxima revisión va a
          considerar qué sugerencias aceptaste acá.
        </p>
        <button
          onClick={() => {
            setSaveError("");
            setPreviewOpen(true);
          }}
          className="ml-5 shrink-0 rounded-[2px] bg-ink px-5 py-3 font-mono text-[12px] uppercase tracking-[0.05em] text-paper transition-colors hover:bg-redline"
        >
          Revisar y guardar
        </button>
      </div>

      <Disclaimer className="mt-10" />

      {previewOpen && (
        <PreviewGuardar
          segments={segments}
          appliedMap={appliedMap}
          appliedCount={appliedCount}
          total={findings.length}
          saving={saving}
          error={saveError}
          onConfirm={confirmarGuardar}
          onCancel={() => {
            if (!saving) {
              setPreviewOpen(false);
              setSaveError("");
            }
          }}
        />
      )}
    </div>
  );
}
