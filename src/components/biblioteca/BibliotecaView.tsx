"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Trash2, ArrowRight, Pencil, Check, X } from "lucide-react";
import { ScoreRing } from "@/components/analisis/ScoreRing";
import { Disclaimer } from "@/components/app/Disclaimer";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Skeleton } from "@/components/ui/Skeleton";
import { hace } from "@/lib/fecha";
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
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameBusy, setRenameBusy] = useState(false);

  useEffect(() => {
    listarContratos()
      .then(setContratos)
      .catch((e) => setError(e instanceof ApiError ? e.message : "No se pudo cargar la biblioteca."))
      .finally(() => setLoading(false));
  }, []);

  async function confirmarRename(id: string) {
    const nombre = renameValue.trim();
    if (!nombre) return setRenamingId(null);
    setRenameBusy(true);
    setError("");
    try {
      await renombrarContrato(id, nombre);
      setContratos((prev) => prev.map((c) => (c.id === id ? { ...c, nombre_archivo: nombre } : c)));
      setRenamingId(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo renombrar el análisis.");
    } finally {
      setRenameBusy(false);
    }
  }

  async function onEliminar(id: string) {
    setConfirmId(null);
    setDeletingId(id);
    setError("");
    try {
      await eliminarContrato(id);
      setContratos((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo eliminar el análisis.");
    } finally {
      setDeletingId(null);
    }
  }

  const { borradores, aprobados } = useMemo(() => {
    return {
      borradores: contratos.filter((c) => c.estado !== "aprobado"),
      aprobados: contratos.filter((c) => c.estado === "aprobado"),
    };
  }, [contratos]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="eyebrow mb-2.5">Biblioteca de precedentes</p>
      <h1 className="mb-2.5 font-serif text-[30px] font-medium">Contratos revisados</h1>
      <p className="mb-8 max-w-[60ch] text-[14.5px] leading-relaxed text-ink-2">
        Cada análisis guardado acá se usa como referencia en las próximas revisiones y se puede
        editar y comentar en equipo hasta darle el visto bueno.
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
        <div className="space-y-8">
          <Seccion
            titulo={`Borradores (${borradores.length})`}
            contratos={borradores}
            {...{ renamingId, renameValue, renameBusy, confirmId, deletingId }}
            setRenamingId={setRenamingId}
            setRenameValue={setRenameValue}
            confirmarRename={confirmarRename}
            setConfirmId={setConfirmId}
            onEliminar={onEliminar}
          />
          {aprobados.length > 0 && (
            <Seccion
              titulo={`Aprobados (${aprobados.length})`}
              contratos={aprobados}
              {...{ renamingId, renameValue, renameBusy, confirmId, deletingId }}
              setRenamingId={setRenamingId}
              setRenameValue={setRenameValue}
              confirmarRename={confirmarRename}
              setConfirmId={setConfirmId}
              onEliminar={onEliminar}
            />
          )}
        </div>
      )}

      <Disclaimer className="mt-10" />
    </div>
  );
}

interface SeccionProps {
  titulo: string;
  contratos: ContratoGuardado[];
  renamingId: string | null;
  renameValue: string;
  renameBusy: boolean;
  confirmId: string | null;
  deletingId: string | null;
  setRenamingId: (v: string | null) => void;
  setRenameValue: (v: string) => void;
  confirmarRename: (id: string) => void;
  setConfirmId: (v: string | null) => void;
  onEliminar: (id: string) => void;
}

function Seccion({
  titulo,
  contratos,
  renamingId,
  renameValue,
  renameBusy,
  confirmId,
  deletingId,
  setRenamingId,
  setRenameValue,
  confirmarRename,
  setConfirmId,
  onEliminar,
}: SeccionProps) {
  if (contratos.length === 0) {
    return (
      <div>
        <p className="eyebrow mb-3 text-ink-3">{titulo}</p>
        <p className="font-mono text-[11px] text-ink-3">— nada acá todavía —</p>
      </div>
    );
  }
  return (
    <div>
      <p className="eyebrow mb-3 text-ink-3">{titulo}</p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence>
          {contratos.map((c) => {
            const aplicadas = c.findings.filter((f) => f.aplicada).length;
            return (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="group flex flex-col rounded-lg border border-line bg-paper-raised p-4 shadow-sm transition-all duration-200 ease-out-expo hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lg"
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
                        <Link
                          href={`/biblioteca/${c.id}`}
                          className="min-w-0 flex-1 truncate text-[14px] font-medium text-ink group-hover:text-accent"
                        >
                          {c.nombre_archivo || "Contrato pegado"}
                        </Link>
                        <button
                          onClick={() => {
                            setRenamingId(c.id);
                            setRenameValue(c.nombre_archivo || "");
                          }}
                          aria-label="Renombrar"
                          className="grid h-6 w-6 shrink-0 place-items-center rounded text-ink-3 opacity-0 transition-opacity hover:bg-paper-2 hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
                        >
                          <Pencil size={12} />
                        </button>
                      </div>
                    )}
                    <span className="mt-1 block font-mono text-[10px] uppercase tracking-eyebrow text-ink-3">
                      {hace(c.created_at)}
                      {c.creado_por ? ` · ${c.creado_por.split("@")[0]}` : ""}
                    </span>
                  </div>
                  {c.score_general != null && <ScoreRing score={c.score_general} size={40} />}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="soft" tone={c.estado === "aprobado" ? "brass" : "accent"}>
                      {c.estado === "aprobado" ? "Aprobado" : "Borrador"}
                    </Badge>
                    {aplicadas > 0 && (
                      <Badge variant="soft" tone="neutral">
                        {aplicadas}/{c.findings.length}
                      </Badge>
                    )}
                  </div>

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
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
