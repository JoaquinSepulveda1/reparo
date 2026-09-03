"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Trash2, Download, ArrowRight, Pencil, Check, X } from "lucide-react";
import { ScoreRing } from "@/components/analisis/ScoreRing";
import { DocumentoTexto } from "@/components/analisis/DocumentoTexto";
import { DocumentoCambios } from "@/components/analisis/DocumentoCambios";
import { Disclaimer } from "@/components/app/Disclaimer";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/components/ui/cn";
import { descargarContratoPdf } from "@/lib/contrato/pdf";
import {
  listarContratos,
  eliminarContrato,
  renombrarContrato,
  ApiError,
  type ContratoGuardado,
} from "@/lib/api";

export function BibliotecaView() {
  const [contratos, setContratos] = useState<ContratoGuardado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameBusy, setRenameBusy] = useState(false);

  function empezarRename(c: ContratoGuardado) {
    setRenamingId(c.id);
    setRenameValue(c.nombre_archivo || "");
  }

  async function confirmarRename(id: string) {
    const nombre = renameValue.trim();
    if (!nombre) {
      setRenamingId(null);
      return;
    }
    setRenameBusy(true);
    setError("");
    try {
      await renombrarContrato(id, nombre);
      setContratos((prev) =>
        prev.map((c) => (c.id === id ? { ...c, nombre_archivo: nombre } : c)),
      );
      setRenamingId(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo renombrar el análisis.");
    } finally {
      setRenameBusy(false);
    }
  }

  async function bajarPdf(c: ContratoGuardado, tipo: "original" | "cambios") {
    setPdfBusy(c.id + tipo);
    setError("");
    try {
      await descargarContratoPdf({
        nombre: c.nombre_archivo || "Contrato",
        titulo: tipo === "original" ? "Original" : "Con cambios aplicados",
        texto: tipo === "original" ? c.texto_original : c.texto_editado || c.texto_original,
        variante: tipo === "original" ? "original" : "con-cambios",
      });
    } catch {
      setError("No se pudo generar el PDF.");
    } finally {
      setPdfBusy("");
    }
  }

  useEffect(() => {
    listarContratos()
      .then(setContratos)
      .catch((e) => setError(e instanceof ApiError ? e.message : "No se pudo cargar la biblioteca."))
      .finally(() => setLoading(false));
  }, []);

  async function onEliminar(id: string) {
    setConfirmId(null);
    setDeletingId(id);
    setError("");
    try {
      await eliminarContrato(id);
      setContratos((prev) => prev.filter((c) => c.id !== id));
      if (openId === id) setOpenId(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo eliminar el análisis.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="eyebrow mb-2.5">Biblioteca de precedentes</p>
      <h1 className="mb-2.5 font-serif text-[30px] font-medium">Contratos revisados</h1>
      <p className="mb-8 max-w-[60ch] text-[14.5px] leading-relaxed text-ink-2">
        Cada análisis guardado acá se usa como referencia en las próximas revisiones: el criterio que
        aceptaste una vez, se aplica de nuevo.
      </p>

      {loading && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-line bg-paper-raised p-4">
              <Skeleton className="mb-3 h-4 w-3/4" />
              <Skeleton className="mb-4 h-3 w-1/2" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="mb-4 rounded border border-line bg-redline-soft px-3 py-2 text-[13px] text-redline">
          {error}
        </p>
      )}

      {!loading && !error && contratos.length === 0 && (
        <div className="rounded-lg border border-dashed border-line-strong bg-paper-raised px-6 py-12 text-center">
          <p className="mb-4 text-[14px] text-ink-3">Todavía no guardaste ningún análisis.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded bg-ink px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.05em] text-paper transition-colors hover:bg-accent"
          >
            Analizar un contrato <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {!loading && contratos.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {contratos.map((c) => {
            const open = openId === c.id;
            const aplicadas = c.findings.filter((f) => f.aplicada).length;
            return (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "group flex flex-col rounded-lg border border-line bg-paper-raised p-4 shadow-sm transition-all duration-200 ease-out-expo hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lg",
                  open && "sm:col-span-2 xl:col-span-3",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    {renamingId === c.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") confirmarRename(c.id);
                            if (e.key === "Escape") setRenamingId(null);
                          }}
                          disabled={renameBusy}
                          className="min-w-0 flex-1 rounded border border-line bg-paper px-2 py-1 text-[13.5px] text-ink outline-none focus:border-ink-3 disabled:opacity-60"
                        />
                        <button
                          onClick={() => confirmarRename(c.id)}
                          disabled={renameBusy}
                          aria-label="Guardar nombre"
                          className="grid h-6 w-6 shrink-0 place-items-center rounded text-ink-3 hover:text-ink"
                        >
                          {renameBusy ? <Spinner size={12} /> : <Check size={13} />}
                        </button>
                        <button
                          onClick={() => setRenamingId(null)}
                          disabled={renameBusy}
                          aria-label="Cancelar"
                          className="grid h-6 w-6 shrink-0 place-items-center rounded text-ink-3 hover:text-ink"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setOpenId(open ? null : c.id)}
                          className="min-w-0 flex-1 truncate text-left text-[14px] font-medium text-ink group-hover:text-accent"
                        >
                          {c.nombre_archivo || "Contrato pegado"}
                        </button>
                        <button
                          onClick={() => empezarRename(c)}
                          aria-label="Renombrar"
                          className="grid h-6 w-6 shrink-0 place-items-center rounded text-ink-3 opacity-0 transition-opacity hover:bg-paper-2 hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
                        >
                          <Pencil size={12} />
                        </button>
                      </div>
                    )}
                    <span className="mt-1 block font-mono text-[10px] uppercase tracking-eyebrow text-ink-3">
                      {new Date(c.created_at).toLocaleDateString("es-CL", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  {c.score_general != null && <ScoreRing score={c.score_general} size={40} />}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <Badge variant="soft" tone={aplicadas > 0 ? "brass" : "neutral"}>
                    {aplicadas}/{c.findings.length} aplicados
                  </Badge>

                  {confirmId === c.id ? (
                    <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.04em]">
                      <span className="text-ink-3">¿Eliminar?</span>
                      <button
                        onClick={() => onEliminar(c.id)}
                        className="rounded-full border border-redline px-2 py-0.5 text-redline hover:bg-redline-soft"
                      >
                        Sí
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="rounded-full border border-line px-2 py-0.5 text-ink-3 hover:text-ink"
                      >
                        No
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmId(c.id)}
                      disabled={deletingId === c.id}
                      aria-label="Eliminar análisis"
                      className="grid h-7 w-7 place-items-center rounded text-ink-3 opacity-0 transition-all hover:bg-paper-2 hover:text-redline focus-visible:opacity-100 group-hover:opacity-100 disabled:opacity-40"
                    >
                      {deletingId === c.id ? <Spinner size={14} /> : <Trash2 size={14} />}
                    </button>
                  )}
                </div>

                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 border-t border-line pt-4">
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                          <span className="mr-1 font-mono text-[10px] uppercase tracking-eyebrow text-ink-3">
                            Descargar PDF
                          </span>
                          {(["original", "cambios"] as const).map((tipo) => (
                            <button
                              key={tipo}
                              onClick={() => bajarPdf(c, tipo)}
                              disabled={pdfBusy === c.id + tipo}
                              className="flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.04em] text-ink-2 transition-colors hover:border-ink hover:text-ink disabled:opacity-50"
                            >
                              {pdfBusy === c.id + tipo ? (
                                <Spinner size={12} />
                              ) : (
                                <Download size={12} />
                              )}
                              {tipo === "original" ? "Original" : "Con cambios"}
                            </button>
                          ))}
                        </div>

                        <div className="grid gap-6 lg:grid-cols-2">
                          <div>
                            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-eyebrow text-ink-3">
                              Original
                            </p>
                            <DocumentoTexto texto={c.texto_original} size="compact" />
                          </div>
                          <div>
                            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-eyebrow text-brass">
                              Con cambios aplicados
                            </p>
                            <DocumentoCambios
                              original={c.texto_original}
                              size="compact"
                              cambios={c.findings
                                .filter((f) => f.aplicada)
                                .map((f) => ({
                                  excerpt: f.excerpt,
                                  sugerencia: f.sugerencia ?? "",
                                  nueva_redaccion: f.nueva_redaccion,
                                  nivel_riesgo: f.nivel_riesgo,
                                }))}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      <Disclaimer className="mt-10" />
    </div>
  );
}
