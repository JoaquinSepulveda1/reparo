"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, AlertTriangle, Sparkles } from "lucide-react";
import { ScoreRing } from "./ScoreRing";
import { DocumentoConHighlights } from "./DocumentoConHighlights";
import { FindingCard } from "./FindingCard";
import { PreviewGuardar } from "./PreviewGuardar";
import { Disclaimer } from "@/components/app/Disclaimer";
import { colors } from "@/lib/design/tokens";
import { buildSegments, buildEditedText, matchedIndices } from "@/lib/contrato/matching";
import { paginar, segmentosPorPagina, paginaPorFinding } from "@/lib/contrato/paginacion";
import { MAX_CHARS_TOTAL } from "@/lib/contrato/constantes";
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
  const [page, setPage] = useState(0);
  const [nombre, setNombre] = useState(fileName);
  const router = useRouter();

  const nombreFinal = nombre.trim() || fileName || "Contrato pegado";

  const markRefs = useRef<Record<number, HTMLElement | null>>({});
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});
  // Finding a cuyo highlight hay que hacer scroll una vez que cambió la página.
  const pendingMark = useRef<number | null>(null);

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

  const paginas = useMemo(() => paginar(contractText), [contractText]);
  const segsPagina = useMemo(
    () => segmentosPorPagina(segments, paginas),
    [segments, paginas],
  );
  const findingPage = useMemo(() => paginaPorFinding(segsPagina), [segsPagina]);

  // Después de saltar de página, hacemos scroll al highlight que quedó pendiente.
  useEffect(() => {
    const idx = pendingMark.current;
    if (idx == null) return;
    pendingMark.current = null;
    const id = requestAnimationFrame(() => {
      markRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => cancelAnimationFrame(id);
  }, [page]);

  function focusMark(idx: number) {
    setActiveIndex(idx);
    cardRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function focusCard(idx: number, hasMatch: boolean) {
    setActiveIndex(idx);
    if (!hasMatch) return;
    const destino = findingPage[idx] ?? 0;
    if (destino !== page) {
      pendingMark.current = idx;
      setPage(destino);
    } else {
      markRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
  function toggleApplied(idx: number) {
    setAppliedMap((p) => ({ ...p, [idx]: !p[idx] }));
  }

  async function confirmarGuardar() {
    setSaving(true);
    setSaveError("");
    try {
      await guardarContrato({
        nombre_archivo: nombreFinal,
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

      {resultado.meta.truncado ? (
        <div
          className="mb-6 rounded-[2px] border border-line px-4 py-3 text-[12.5px] text-ink-2"
          style={{ background: colors.redline.soft }}
        >
          <AlertTriangle
            size={13}
            className="mr-1.5 inline align-[-2px]"
            style={{ color: colors.redline.DEFAULT }}
          />
          El contrato supera el máximo analizable ({MAX_CHARS_TOTAL.toLocaleString("es-CL")}{" "}
          caracteres). Se revisaron los primeros{" "}
          {resultado.meta.chars_analizados.toLocaleString("es-CL")} en{" "}
          {resultado.meta.chunks} partes; el resto quedó fuera.
        </div>
      ) : (
        resultado.meta.chunks > 1 && (
          <p className="mb-6 font-mono text-[10.5px] text-ink-3">
            documento largo — analizado en {resultado.meta.chunks} partes
          </p>
        )
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
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
            segmentosPagina={segsPagina}
            activeIndex={activeIndex}
            appliedMap={appliedMap}
            docMode={docMode}
            page={page}
            onPageChange={setPage}
            onMarkClick={focusMark}
            markRefs={markRefs}
          />
        </div>

        {/* Findings */}
        <div>
          <p className="mb-2.5 font-mono text-[11px] uppercase tracking-eyebrow text-ink-3">
            <AlertTriangle size={12} className="mr-1 inline" /> Puntos a revisar ({findings.length})
          </p>
          <div className="flex max-h-[560px] flex-col gap-3 overflow-y-auto lg:max-h-[68vh] lg:pr-1">
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
          original={contractText}
          nombre={nombre}
          onNombreChange={setNombre}
          placeholderNombre={fileName || "Contrato pegado"}
          cambios={findings.flatMap((f, i) =>
            appliedMap[i]
              ? [
                  {
                    excerpt: f.excerpt,
                    sugerencia: f.sugerencia ?? "",
                    nueva_redaccion: f.nueva_redaccion,
                    nivel_riesgo: f.nivel_riesgo,
                  },
                ]
              : [],
          )}
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
