"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

interface Props {
  /** Posición en viewport (fixed). */
  x: number;
  y: number;
  /** Fragmento seleccionado (para mostrar contexto). Vacío = comentario general. */
  excerpt?: string;
  guardando?: boolean;
  onEnviar: (cuerpo: string) => void;
  onCancelar: () => void;
}

const WIDTH = 300;

/** Popover para escribir un comentario nuevo, anclado a la selección. */
export function ComentarioComposer({ x, y, excerpt, guardando, onEnviar, onCancelar }: Props) {
  const [cuerpo, setCuerpo] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const t = requestAnimationFrame(() => ref.current?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancelar();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [onCancelar]);

  const left = Math.max(12, Math.min(x, window.innerWidth - WIDTH - 12));
  const top = Math.min(y, window.innerHeight - 200);

  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
      className="glass fixed z-[80] rounded-lg border p-3 shadow-lg"
      style={{ left, top, width: WIDTH }}
      onClick={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
    >
      {excerpt ? (
        <p className="mb-2 line-clamp-2 border-l-2 border-accent pl-2 font-serif text-[11.5px] italic text-ink-2">
          {excerpt}
        </p>
      ) : (
        <p className="mb-2 font-mono text-[9px] uppercase tracking-eyebrow text-ink-3">
          Comentario general
        </p>
      )}
      <textarea
        ref={ref}
        value={cuerpo}
        onChange={(e) => setCuerpo(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && cuerpo.trim()) {
            onEnviar(cuerpo.trim());
          }
        }}
        rows={3}
        placeholder="Escribí un comentario…"
        className="w-full resize-y rounded border border-line bg-paper-raised p-2 text-[12.5px] text-ink outline-none focus:border-ink-3"
      />
      <div className="mt-2 flex items-center justify-end gap-2">
        <button
          onClick={onCancelar}
          className="font-mono text-[10px] uppercase tracking-[0.04em] text-ink-3 hover:text-ink"
        >
          Cancelar
        </button>
        <Button
          size="sm"
          loading={guardando}
          disabled={!cuerpo.trim()}
          onClick={() => onEnviar(cuerpo.trim())}
        >
          Comentar
        </Button>
      </div>
    </motion.div>
  );
}
