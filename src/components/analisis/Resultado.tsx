"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, FileText, AlertTriangle, Sparkles } from "lucide-react";
import { ScoreRing } from "./ScoreRing";
import { DocumentoConHighlights } from "./DocumentoConHighlights";
import { FindingCard } from "./FindingCard";
import { PreviewGuardar } from "./PreviewGuardar";
import { Disclaimer } from "@/components/app/Disclaimer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Kbd } from "@/components/ui/Kbd";
import { cn } from "@/components/ui/cn";
import { buildSegments, buildEditedText, matchedIndices } from "@/lib/contrato/matching";
import { paginar, segmentosPorPagina, paginaPorFinding } from "@/lib/contrato/paginacion";
import { MAX_CHARS_TOTAL } from "@/lib/contrato/constantes";
import { scoreColor } from "@/lib/design/tokens";
import { useFindingKeyboardNav } from "@/lib/hooks/useFindingKeyboardNav";
import { guardarContrato, ApiError, type AnalizarResponse } from "@/lib/api";

interface Props {
  resultado: AnalizarResponse;
  contractText: string;
  fileName: string;
  onReset: () => void;
}

export function Resultado({ resultado, contractText, fileName, onReset }: Props) {
  const { findings } = resultado;

  const [activeIndex, setActiveIndex] = useState<number | null>(findings.length ? 0 : null);
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
  const pendingMark = useRef<number | null>(null);

  const segments = useMemo(
    () => buildSegments(contractText, findings.map((f) => ({ ...f }))),
    [contractText, findings],
  );
  const matched = useMemo(() => matchedIndices(segments), [segments]);
  const editedText = useMemo(() => buildEditedText(segments, appliedMap), [segments, appliedMap]);
  const appliedCount = Object.values(appliedMap).filter(Boolean).length;

  const paginas = useMemo(() => paginar(contractText), [contractText]);
  const segsPagina = useMemo(() => segmentosPorPagina(segments, paginas), [segments, paginas]);
  const findingPage = useMemo(() => paginaPorFinding(segsPagina), [segsPagina]);

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

  useFindingKeyboardNav({
    count: findings.length,
    activeIndex,
    setActiveIndex: focusMark,
    onJump: (i) => focusCard(i, matched.has(i)),
    onToggleApply: toggleApplied,
    enabled: !previewOpen,
  });

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
      router.push("/biblioteca");
    } catch (e) {
      setSaveError(e instanceof ApiError ? e.message : "No pude guardar. Intentá de nuevo.");
      setSaving(false);
    }
  }

  const scoreCol = scoreColor(resultado.score_general);

  return (
    <div>
      {/* Sub-barra sticky de acción */}
      <div className="glass sticky top-14 z-30 -mx-4 mb-6 flex items-center gap-3 border-b px-4 py-2.5 sm:-mx-6 sm:px-6">
        <button
          onClick={onReset}
          className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.04em] text-ink-3 transition-colors hover:text-ink"
        >
          <ArrowLeft size={13} /> <span className="hidden sm:inline">Analizar otro</span>
        </button>
        <span className="h-4 w-px bg-line" />
        <span className="tabnums flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.04em] text-ink-2">
          <span
            className="grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-[11px] font-semibold"
            style={{ color: scoreCol, boxShadow: `inset 0 0 0 1.5px ${scoreCol}` }}
          >
            {resultado.score_general}
          </span>
          {findings.length} {findings.length === 1 ? "punto" : "puntos"}
          {appliedCount > 0 && (
            <span className="hidden text-ink-3 sm:inline">· {appliedCount} aplicados</span>
          )}
        </span>
        <div className="ml-auto">
          <Button
            size="sm"
            onClick={() => {
              setSaveError("");
              setPreviewOpen(true);
            }}
          >
            Revisar y guardar
          </Button>
        </div>
      </div>

      {/* Panel de score */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mb-6 flex items-center gap-5 rounded-lg border border-line bg-paper-raised px-5 py-5 shadow-md sm:gap-6 sm:px-6"
      >
        <ScoreRing score={resultado.score_general} />
        <div className="min-w-0">
          <p className="eyebrow mb-1">Puntaje de riesgo general</p>
          <p className="text-[14.5px] leading-snug text-ink-2">{resultado.resumen}</p>
          {resultado.uso_precedentes && (
            <span className="mt-2 inline-flex items-center gap-1.5">
              <Badge tone="accent" variant="soft">
                <Sparkles size={10} /> Informado con precedentes
              </Badge>
            </span>
          )}
        </div>
      </motion.div>

      {resultado.meta.truncado ? (
        <div className="mb-6 flex items-start gap-2 rounded border border-line bg-redline-soft px-4 py-3 text-[12.5px] leading-snug text-ink-2">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-redline" />
          <span>
            El contrato supera el máximo analizable ({MAX_CHARS_TOTAL.toLocaleString("es-CL")}{" "}
            caracteres). Se revisaron los primeros{" "}
            {resultado.meta.chars_analizados.toLocaleString("es-CL")} en {resultado.meta.chunks}{" "}
            partes; el resto quedó fuera.
          </span>
        </div>
      ) : (
        resultado.meta.chunks > 1 && (
          <p className="mb-6">
            <Badge variant="soft">Documento largo · analizado en {resultado.meta.chunks} partes</Badge>
          </p>
        )
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
        {/* Documento */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="eyebrow flex items-center gap-1.5 text-ink-3">
              <FileText size={12} /> Documento
            </span>
            <div className="relative flex rounded border border-line p-0.5">
              {(["original", "edited"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setDocMode(m)}
                  className={cn(
                    "relative z-10 rounded-sm px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.04em] transition-colors",
                    docMode === m ? "text-paper" : "text-ink-3 hover:text-ink",
                  )}
                >
                  {docMode === m && (
                    <motion.span
                      layoutId="resultado-docmode"
                      className="absolute inset-0 -z-0 rounded-sm bg-ink"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative">{m === "original" ? "Original" : "Con cambios"}</span>
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
            onToggleApplied={toggleApplied}
            markRefs={markRefs}
          />
        </div>

        {/* Findings */}
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <span className="eyebrow flex items-center gap-1.5 text-ink-3">
              <AlertTriangle size={12} /> Puntos a revisar ({findings.length})
            </span>
            {findings.length > 1 && (
              <span className="hidden items-center gap-1 font-mono text-[9.5px] uppercase tracking-[0.04em] text-ink-3 lg:flex">
                <Kbd>J</Kbd>
                <Kbd>K</Kbd> mover · <Kbd>A</Kbd> aplicar
              </span>
            )}
          </div>
          <div className="scroll-fade thin-scroll flex max-h-[560px] flex-col gap-3 overflow-y-auto pr-1 lg:max-h-[calc(100vh-9rem)]">
            {findings.map((f, i) => (
              <FindingCard
                key={i}
                index={i}
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
      <div className="mt-8 flex flex-col items-start gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-[52ch] text-[12.5px] leading-snug text-ink-3">
          <Sparkles size={12} className="mr-1 inline align-[-1px]" />
          Guardar este análisis lo agrega a la biblioteca de precedentes: la próxima revisión va a
          considerar qué sugerencias aceptaste acá.
        </p>
        <Button
          size="sm"
          className="shrink-0"
          onClick={() => {
            setSaveError("");
            setPreviewOpen(true);
          }}
        >
          Revisar y guardar
        </Button>
      </div>

      <Disclaimer className="mt-10" />

      <AnimatePresence>
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
      </AnimatePresence>
    </div>
  );
}
