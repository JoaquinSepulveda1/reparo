"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  FileText,
  AlertTriangle,
  Sparkles,
  ArrowLeft,
  Download,
  Trash2,
  CheckCircle2,
  Undo2,
} from "lucide-react";
import { ScoreRing } from "@/components/analisis/ScoreRing";
import {
  DocumentoConHighlights,
  type SeleccionParaComentar,
} from "@/components/analisis/DocumentoConHighlights";
import { PanelRevision } from "@/components/comentarios/PanelRevision";
import { ComentarioComposer } from "@/components/comentarios/ComentarioComposer";
import { PreviewGuardar } from "@/components/analisis/PreviewGuardar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/components/ui/cn";
import { buildSegments, buildEditedText, matchedIndices } from "@/lib/contrato/matching";
import { paginar, segmentosPorPagina, paginaPorFinding } from "@/lib/contrato/paginacion";
import { limpiarSeleccion } from "@/lib/contrato/seleccion";
import { MAX_CHARS_TOTAL } from "@/lib/contrato/constantes";
import { descargarContratoPdf } from "@/lib/contrato/pdf";
import { useFindingKeyboardNav } from "@/lib/hooks/useFindingKeyboardNav";
import { useComentarios } from "@/lib/hooks/useComentarios";
import {
  guardarContrato,
  actualizarContrato,
  aprobarContrato,
  reabrirContrato,
  eliminarContrato,
  ApiError,
  type AnalizarResponse,
  type Finding,
  type EstadoContrato,
} from "@/lib/api";

interface Props {
  modo: "analisis" | "guardado";
  contractText: string;
  scoreGeneral: number;
  resumen: string;
  findings: Finding[];
  usoPrecedentes?: boolean;
  meta?: AnalizarResponse["meta"];
  nombre: string;
  contratoId: string | null;
  aplicadasIniciales?: Record<number, boolean>;
  estado?: EstadoContrato;
  aprobadoPor?: string | null;
  onReset?: () => void;
}

export function RevisionWorkspace({
  modo,
  contractText,
  scoreGeneral,
  resumen,
  findings,
  usoPrecedentes,
  meta,
  nombre,
  contratoId: contratoIdProp,
  aplicadasIniciales,
  estado: estadoProp,
  aprobadoPor,
  onReset,
}: Props) {
  const router = useRouter();
  const [contratoId, setContratoId] = useState<string | null>(contratoIdProp);
  useEffect(() => setContratoId(contratoIdProp), [contratoIdProp]);

  const [estado, setEstado] = useState<EstadoContrato>(estadoProp ?? "borrador");
  const [activeIndex, setActiveIndex] = useState<number | null>(findings.length ? 0 : null);
  const [appliedMap, setAppliedMap] = useState<Record<number, boolean>>(aplicadasIniciales ?? {});
  const [docMode, setDocMode] = useState<"original" | "edited">("original");
  const [page, setPage] = useState(0);
  const [seleccion, setSeleccion] = useState<SeleccionParaComentar | null>(null);
  const [general, setGeneral] = useState(false);
  const [guardandoComentario, setGuardandoComentario] = useState(false);
  const [hiloActivo, setHiloActivo] = useState<string | null>(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [nombreGuardar, setNombreGuardar] = useState(nombre);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [accionBusy, setAccionBusy] = useState("");

  const markRefs = useRef<Record<number, HTMLElement | null>>({});
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const pendingMark = useRef<number | null>(null);

  const { hilos, yo, crear, resolver, borrar } = useComentarios(contratoId);

  const segments = useMemo(
    () => buildSegments(contractText, findings.map((f) => ({ ...f }))),
    [contractText, findings],
  );
  const matched = useMemo(() => matchedIndices(segments), [segments]);
  const editedText = useMemo(() => buildEditedText(segments, appliedMap), [segments, appliedMap]);
  const appliedCount = Object.values(appliedMap).filter(Boolean).length;

  const paginas = useMemo(() => paginar(contractText), [contractText]);
  const paginaOffsets = useMemo(() => paginas.map((p) => p.start), [paginas]);
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

  const ensureContrato = useCallback(async (): Promise<string> => {
    if (contratoId) return contratoId;
    const { id } = await guardarContrato({
      nombre_archivo: nombre || "Contrato pegado",
      texto_original: contractText,
      texto_editado: editedText,
      score_general: scoreGeneral,
      resumen,
      findings: findings.map((f, i) => ({ ...f, aplicada: !!appliedMap[i] })),
    });
    setContratoId(id);
    return id;
  }, [contratoId, nombre, contractText, editedText, scoreGeneral, resumen, findings, appliedMap]);

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
    setAppliedMap((prev) => {
      const next = { ...prev, [idx]: !prev[idx] };
      if (modo === "guardado" && contratoId) {
        actualizarContrato(contratoId, {
          texto_editado: buildEditedText(segments, next),
          findings_aplicada: findings.map((f, i) => ({ excerpt: f.excerpt, aplicada: !!next[i] })),
        }).catch(() => {});
      }
      return next;
    });
  }

  useFindingKeyboardNav({
    count: findings.length,
    activeIndex,
    setActiveIndex: focusMark,
    onJump: (i) => focusCard(i, matched.has(i)),
    onToggleApply: toggleApplied,
    enabled: !seleccion && !general && !previewOpen,
  });

  async function enviarComentario(cuerpo: string) {
    setGuardandoComentario(true);
    try {
      await ensureContrato();
      await crear({
        cuerpo,
        rango_inicio: seleccion?.inicio ?? null,
        rango_fin: seleccion?.fin ?? null,
        excerpt: seleccion?.texto ?? null,
      });
      setSeleccion(null);
      setGeneral(false);
      limpiarSeleccion();
    } finally {
      setGuardandoComentario(false);
    }
  }

  function irAlAncla(inicio: number) {
    const destino = paginas.findIndex((p) => inicio >= p.start && inicio < p.end);
    if (destino >= 0) setPage(destino);
  }

  async function confirmarGuardar() {
    setSaving(true);
    setSaveError("");
    try {
      const id = await ensureContrato();
      await actualizarContrato(id, {
        nombre_archivo: nombreGuardar.trim() || nombre || "Contrato pegado",
        texto_editado: editedText,
        findings_aplicada: findings.map((f, i) => ({ excerpt: f.excerpt, aplicada: !!appliedMap[i] })),
      });
      router.push(`/biblioteca/${id}`);
    } catch (e) {
      setSaveError(e instanceof ApiError ? e.message : "No pude guardar. Intentá de nuevo.");
      setSaving(false);
    }
  }

  async function accion(tipo: "aprobar" | "reabrir" | "eliminar" | "pdf-original" | "pdf-cambios") {
    if (!contratoId) return;
    setAccionBusy(tipo);
    try {
      if (tipo === "aprobar") {
        await aprobarContrato(contratoId);
        setEstado("aprobado");
      } else if (tipo === "reabrir") {
        await reabrirContrato(contratoId);
        setEstado("borrador");
      } else if (tipo === "eliminar") {
        await eliminarContrato(contratoId);
        router.push("/biblioteca");
        return;
      } else {
        await descargarContratoPdf({
          nombre: nombre || "Contrato",
          titulo: tipo === "pdf-original" ? "Original" : "Con cambios aplicados",
          texto: tipo === "pdf-original" ? contractText : editedText,
          variante: tipo === "pdf-original" ? "original" : "con-cambios",
        });
      }
    } catch {
      /* noop */
    } finally {
      setAccionBusy("");
    }
  }

  const comentariosPlanos = useMemo(
    () => hilos.flatMap((h) => [h.raiz, ...h.respuestas]),
    [hilos],
  );

  return (
    <div>
      {/* Barra de acción */}
      <div className="glass sticky top-14 z-30 -mx-4 mb-6 flex flex-wrap items-center gap-3 border-b px-4 py-2.5 sm:-mx-6 sm:px-6">
        {modo === "analisis" ? (
          <button
            onClick={onReset}
            className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.04em] text-ink-3 transition-colors hover:text-ink"
          >
            <ArrowLeft size={13} /> <span className="hidden sm:inline">Analizar otro</span>
          </button>
        ) : (
          <button
            onClick={() => router.push("/biblioteca")}
            className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.04em] text-ink-3 transition-colors hover:text-ink"
          >
            <ArrowLeft size={13} /> <span className="hidden sm:inline">Biblioteca</span>
          </button>
        )}

        <span className="h-4 w-px bg-line" />
        <Badge variant="soft" tone={estado === "aprobado" ? "brass" : "accent"}>
          {estado === "aprobado" ? "Aprobado" : "Borrador"}
        </Badge>
        <span className="tabnums font-mono text-[11px] uppercase tracking-[0.04em] text-ink-3">
          {findings.length} {findings.length === 1 ? "punto" : "puntos"}
          {appliedCount > 0 && ` · ${appliedCount} aplicados`}
        </span>

        <div className="ml-auto flex items-center gap-2">
          {modo === "analisis" ? (
            <Button
              size="sm"
              onClick={() => {
                setSaveError("");
                setNombreGuardar(nombre);
                setPreviewOpen(true);
              }}
            >
              Revisar y guardar
            </Button>
          ) : (
            <>
              <button
                onClick={() => accion("pdf-original")}
                disabled={!!accionBusy}
                className="hidden items-center gap-1 rounded border border-line px-2 py-1 font-mono text-[10px] uppercase tracking-[0.04em] text-ink-3 hover:text-ink sm:flex"
              >
                {accionBusy === "pdf-original" ? <Spinner size={11} /> : <Download size={11} />} PDF
              </button>
              {estado === "borrador" ? (
                <Button size="sm" loading={accionBusy === "aprobar"} onClick={() => accion("aprobar")}>
                  <CheckCircle2 size={13} /> Dar visto bueno
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  loading={accionBusy === "reabrir"}
                  onClick={() => accion("reabrir")}
                >
                  <Undo2 size={13} /> Volver a editar
                </Button>
              )}
              <button
                onClick={() => accion("eliminar")}
                disabled={!!accionBusy}
                aria-label="Eliminar"
                className="grid h-7 w-7 place-items-center rounded text-ink-3 hover:text-redline"
              >
                {accionBusy === "eliminar" ? <Spinner size={13} /> : <Trash2 size={13} />}
              </button>
            </>
          )}
        </div>
      </div>

      {modo === "guardado" && estado === "aprobado" && aprobadoPor && (
        <p className="mb-4 font-mono text-[10.5px] uppercase tracking-eyebrow text-brass">
          Visto bueno de {aprobadoPor}
        </p>
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mb-6 flex items-center gap-5 rounded-lg border border-line bg-paper-raised px-5 py-5 shadow-md sm:gap-6 sm:px-6"
      >
        <ScoreRing score={scoreGeneral} />
        <div className="min-w-0">
          <p className="eyebrow mb-1">Puntaje de riesgo general</p>
          <p className="text-[14.5px] leading-snug text-ink-2">{resumen}</p>
          {usoPrecedentes && (
            <span className="mt-2 inline-flex">
              <Badge tone="accent" variant="soft">
                <Sparkles size={10} /> Informado con precedentes
              </Badge>
            </span>
          )}
        </div>
      </motion.div>

      {meta?.truncado ? (
        <div className="mb-6 flex items-start gap-2 rounded border border-line bg-redline-soft px-4 py-3 text-[12.5px] leading-snug text-ink-2">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-redline" />
          <span>
            El contrato supera el máximo analizable ({MAX_CHARS_TOTAL.toLocaleString("es-CL")}{" "}
            caracteres). Se revisaron los primeros{" "}
            {meta.chars_analizados.toLocaleString("es-CL")} en {meta.chunks} partes.
          </span>
        </div>
      ) : (
        meta && meta.chunks > 1 && (
          <p className="mb-6">
            <Badge variant="soft">Documento largo · analizado en {meta.chunks} partes</Badge>
          </p>
        )
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
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
                      layoutId="workspace-docmode"
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
            paginaOffsets={paginaOffsets}
            activeIndex={activeIndex}
            appliedMap={appliedMap}
            docMode={docMode}
            page={page}
            onPageChange={setPage}
            onMarkClick={focusMark}
            onToggleApplied={toggleApplied}
            markRefs={markRefs}
            comentarios={comentariosPlanos}
            hiloActivo={hiloActivo}
            onComentarSeleccion={(s) => {
              setGeneral(false);
              setSeleccion(s);
            }}
            onAbrirComentario={(id) => {
              setHiloActivo(id);
              const h = hilos.find((x) => x.raiz.id === id);
              if (h?.raiz.rango_inicio != null) irAlAncla(h.raiz.rango_inicio);
            }}
          />
          {docMode === "edited" && (
            <p className="mt-2 font-mono text-[10px] text-ink-3">
              Para comentar, volvé a la vista Original.
            </p>
          )}
        </div>

        <PanelRevision
          findings={findings}
          matched={matched}
          activeIndex={activeIndex}
          appliedMap={appliedMap}
          onSelectFinding={(i) => focusCard(i, matched.has(i))}
          onToggleApplied={toggleApplied}
          cardRefs={cardRefs}
          hilos={hilos}
          yo={yo}
          hiloActivo={hiloActivo}
          puedeComentar
          onNuevoComentario={() => {
            setSeleccion(null);
            setGeneral(true);
          }}
          onSelectHilo={setHiloActivo}
          onIrAncla={(h) => {
            if (h.raiz.rango_inicio != null) irAlAncla(h.raiz.rango_inicio);
          }}
          onResponder={(raizId, cuerpo) =>
            ensureContrato().then(() => crear({ cuerpo, parent_id: raizId }))
          }
          onResolver={resolver}
          onBorrar={borrar}
        />
      </div>

      <AnimatePresence>
        {(seleccion || general) && (
          <ComentarioComposer
            x={seleccion?.x ?? (typeof window !== "undefined" ? window.innerWidth / 2 - 150 : 100)}
            y={seleccion?.y ?? 160}
            excerpt={seleccion?.texto}
            guardando={guardandoComentario}
            onEnviar={enviarComentario}
            onCancelar={() => {
              setSeleccion(null);
              setGeneral(false);
              limpiarSeleccion();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewOpen && (
          <PreviewGuardar
            original={contractText}
            nombre={nombreGuardar}
            onNombreChange={setNombreGuardar}
            placeholderNombre={nombre || "Contrato pegado"}
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
