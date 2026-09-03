"use client";

import { useState } from "react";
import { Check, CornerDownRight, Trash2, MapPin } from "lucide-react";
import { hace } from "@/lib/fecha";
import { cn } from "@/components/ui/cn";
import type { Hilo } from "@/lib/hooks/useComentarios";

interface Props {
  hilo: Hilo;
  yo: string;
  activo?: boolean;
  onSelect?: () => void;
  onIrAlAncla?: () => void;
  onResponder: (cuerpo: string) => void;
  onResolver: (resuelto: boolean) => void;
  onBorrar: (comentarioId: string) => void;
}

function Avatar({ nombre }: { nombre: string }) {
  const ini = nombre.trim().slice(0, 2).toUpperCase();
  return (
    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-soft font-mono text-[9px] font-semibold text-accent">
      {ini}
    </span>
  );
}

export function HiloComentario({
  hilo,
  yo,
  activo,
  onSelect,
  onIrAlAncla,
  onResponder,
  onResolver,
  onBorrar,
}: Props) {
  const { raiz, respuestas } = hilo;
  const [respondiendo, setRespondiendo] = useState(false);
  const [texto, setTexto] = useState("");

  const nombre = (c: { autor_nombre: string | null; autor_email: string }) =>
    c.autor_nombre || c.autor_email.split("@")[0];

  return (
    <div
      onClick={onSelect}
      className={cn(
        "rounded-lg border bg-paper-raised p-3 shadow-sm transition-colors",
        activo ? "border-accent" : "border-line",
        raiz.resuelto && "opacity-60",
      )}
    >
      {raiz.excerpt && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onIrAlAncla?.();
          }}
          className="mb-2 flex w-full items-start gap-1 rounded border-l-2 border-accent bg-accent-soft py-1 pl-2 pr-1 text-left"
        >
          <MapPin size={11} className="mt-0.5 shrink-0 text-accent" />
          <span className="line-clamp-2 font-serif text-[11.5px] italic text-ink-2">
            {raiz.excerpt}
          </span>
        </button>
      )}

      <Comentario c={raiz} nombre={nombre(raiz)} mio={raiz.autor_email === yo} onBorrar={onBorrar} />

      {respuestas.length > 0 && (
        <div className="mt-2 space-y-2 border-l border-line pl-3">
          {respuestas.map((r) => (
            <Comentario
              key={r.id}
              c={r}
              nombre={nombre(r)}
              mio={r.autor_email === yo}
              onBorrar={onBorrar}
            />
          ))}
        </div>
      )}

      <div className="mt-2.5 flex items-center gap-3">
        {!respondiendo && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setRespondiendo(true);
            }}
            className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.04em] text-ink-3 hover:text-ink"
          >
            <CornerDownRight size={11} /> Responder
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onResolver(!raiz.resuelto);
          }}
          className={cn(
            "inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.04em]",
            raiz.resuelto ? "text-brass" : "text-ink-3 hover:text-ink",
          )}
        >
          <Check size={11} /> {raiz.resuelto ? "Resuelto" : "Resolver"}
        </button>
      </div>

      {respondiendo && (
        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
          <textarea
            autoFocus
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={2}
            placeholder="Tu respuesta…"
            className="w-full resize-y rounded border border-line bg-paper p-2 text-[12px] text-ink outline-none focus:border-ink-3"
          />
          <div className="mt-1.5 flex justify-end gap-2">
            <button
              onClick={() => {
                setRespondiendo(false);
                setTexto("");
              }}
              className="font-mono text-[10px] uppercase tracking-[0.04em] text-ink-3 hover:text-ink"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                if (!texto.trim()) return;
                onResponder(texto.trim());
                setTexto("");
                setRespondiendo(false);
              }}
              className="rounded bg-ink px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.04em] text-paper hover:bg-accent"
            >
              Responder
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Comentario({
  c,
  nombre,
  mio,
  onBorrar,
}: {
  c: {
    id: string;
    autor_nombre: string | null;
    autor_email: string;
    cuerpo: string;
    created_at: string;
  };
  nombre: string;
  mio: boolean;
  onBorrar: (id: string) => void;
}) {
  return (
    <div className="group/c">
      <div className="flex items-center gap-2">
        <Avatar nombre={nombre} />
        <span className="text-[12px] font-medium text-ink">{nombre}</span>
        <span className="font-mono text-[10px] text-ink-3">{hace(c.created_at)}</span>
        {mio && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBorrar(c.id);
            }}
            aria-label="Borrar"
            className="ml-auto text-ink-3 opacity-0 transition-opacity hover:text-redline group-hover/c:opacity-100"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
      <p className="ml-8 mt-0.5 whitespace-pre-wrap text-[12.5px] leading-snug text-ink-2">
        {c.cuerpo}
      </p>
    </div>
  );
}
