"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import type { FindingLike } from "@/lib/contrato/matching";
import { DocumentoCambios } from "./DocumentoCambios";

interface Props {
  /** Texto original del contrato. */
  original: string;
  /** Hallazgos cuyo cambio se aplicó. */
  cambios: FindingLike[];
  /** Nombre con el que se guardará el análisis. */
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
 * cambios, paginado: lo reemplazado tachado, lo nuevo en negrita. Recién al
 * confirmar acá se persiste y se navega a la biblioteca.
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(27,42,74,0.35)" }}
      onClick={() => !saving && onCancel()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="flex max-h-[88vh] w-full max-w-4xl flex-col border border-line bg-paper shadow-doc"
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
            className="mt-1 text-ink-3 hover:text-ink disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
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
              className="w-full rounded-[2px] border border-line bg-paper-raised px-3 py-2 font-serif text-[14px] text-ink outline-none focus:border-ink disabled:opacity-60"
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
          {error && <p className="mt-3 text-[13px] text-redline">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-4 border-t border-line px-5 py-4">
          <button
            onClick={onCancel}
            disabled={saving}
            className="font-mono text-[12px] uppercase tracking-[0.05em] text-ink-3 hover:text-ink disabled:opacity-50"
          >
            Volver
          </button>
          <button
            onClick={onConfirm}
            disabled={saving}
            className="rounded-[2px] bg-ink px-5 py-3 font-mono text-[12px] uppercase tracking-[0.05em] text-paper transition-colors hover:bg-redline disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Confirmar y guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
