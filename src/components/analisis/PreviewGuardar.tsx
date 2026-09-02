"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { colors } from "@/lib/design/tokens";
import { textoDeReemplazo, type Segment } from "@/lib/contrato/matching";
import { HoverTipText } from "./HoverTipText";
import type { Finding } from "@/lib/api";

interface Props {
  segments: Segment<Finding>[];
  appliedMap: Record<number, boolean>;
  appliedCount: number;
  total: number;
  saving: boolean;
  error: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Modal de confirmación previo a guardar. Muestra el documento con control de
 * cambios: lo reemplazado tachado, lo nuevo en negrita. Recién al confirmar
 * acá se persiste y se navega a la biblioteca.
 */
export function PreviewGuardar({
  segments,
  appliedMap,
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
        className="flex max-h-[85vh] w-full max-w-2xl flex-col border border-line bg-paper shadow-doc"
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
          <p className="mb-3 font-mono text-[11px] uppercase tracking-eyebrow text-ink-3">
            {appliedCount} de {total} cambios aplicados
          </p>

          <div className="whitespace-pre-wrap border border-line bg-paper-raised p-5 font-serif text-[13.5px] leading-[1.75] text-ink-2">
            {segments.map((seg, i) => {
              if (seg.type === "text") return <span key={i}>{seg.content}</span>;
              if (!appliedMap[seg.idx]) return <span key={i}>{seg.content}</span>;
              return (
                <span key={i}>
                  <del
                    style={{
                      color: colors.redline.DEFAULT,
                      textDecorationThickness: "1.5px",
                      opacity: 0.65,
                    }}
                  >
                    {seg.content}
                  </del>{" "}
                  <HoverTipText
                    tip={seg.f.sugerencia || "—"}
                    className="cursor-help"
                    style={{ color: colors.ink.DEFAULT, fontWeight: 700 }}
                  >
                    {textoDeReemplazo(seg.f)}
                  </HoverTipText>
                </span>
              );
            })}
          </div>

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
