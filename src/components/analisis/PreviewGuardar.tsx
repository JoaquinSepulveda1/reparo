"use client";

import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import type { FindingLike } from "@/lib/contrato/matching";
import { Button } from "@/components/ui/Button";
import { DocumentoCambios } from "./DocumentoCambios";

interface Props {
  original: string;
  cambios: FindingLike[];
  nombre: string;
  onNombreChange: (v: string) => void;
  placeholderNombre: string;
  appliedCount: number;
  total: number;
  saving: boolean;
  error: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Modal de confirmación previo a guardar. Muestra el documento con control de
 * cambios, paginado. Recién al confirmar acá se persiste y se navega a la
 * biblioteca.
 */
export function PreviewGuardar({
  original,
  cambios,
  nombre,
  onNombreChange,
  placeholderNombre,
  appliedCount,
  total,
  saving,
  error,
  onConfirm,
  onCancel,
}: Props) {
  const reduce = useReducedMotion();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onCancel();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onCancel, saving]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        background: "color-mix(in srgb, var(--ink) 34%, transparent)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
      onClick={() => !saving && onCancel()}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-line bg-paper shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-line px-5 py-4">
          <div>
            <p className="eyebrow">Confirmar cambios</p>
            <h2 className="mt-1 font-serif text-[20px] font-medium">
              Revisá el documento antes de guardar
            </h2>
          </div>
          <button
            onClick={onCancel}
            disabled={saving}
            aria-label="Cerrar"
            className="mt-1 grid h-7 w-7 place-items-center rounded text-ink-3 transition-colors hover:bg-paper-raised hover:text-ink disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 thin-scroll">
          <label className="mb-4 block">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-eyebrow text-ink-3">
              Nombre del análisis
            </span>
            <input
              type="text"
              value={nombre}
              onChange={(e) => onNombreChange(e.target.value)}
              placeholder={placeholderNombre}
              disabled={saving}
              className="w-full rounded border border-line bg-paper-raised px-3 py-2 font-serif text-[14px] text-ink outline-none transition-colors focus:border-ink-3 disabled:opacity-60"
            />
          </label>

          <p className="mb-3 font-mono text-[11px] uppercase tracking-eyebrow text-ink-3">
            {appliedCount} de {total} cambios aplicados
          </p>

          <DocumentoCambios original={original} cambios={cambios} size="compact" />

          {appliedCount === 0 && (
            <p className="mt-3 font-mono text-[10.5px] text-ink-3">
              No aplicaste ningún cambio: se guarda el texto original tal cual.
            </p>
          )}
          {error && (
            <p className="mt-3 rounded border border-line bg-redline-soft px-3 py-2 text-[13px] text-redline">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-line px-5 py-4">
          <Button variant="ghost" onClick={onCancel} disabled={saving}>
            Volver
          </Button>
          <Button size="sm" onClick={onConfirm} loading={saving}>
            {saving ? "Guardando…" : "Confirmar y guardar"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
