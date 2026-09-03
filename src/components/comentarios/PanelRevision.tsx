"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, MessageSquarePlus, MessagesSquare } from "lucide-react";
import { FindingCard } from "@/components/analisis/FindingCard";
import { HiloComentario } from "./HiloComentario";
import { Kbd } from "@/components/ui/Kbd";
import { cn } from "@/components/ui/cn";
import type { Finding } from "@/lib/api";
import type { Hilo } from "@/lib/hooks/useComentarios";

type Filtro = "todo" | "ia" | "comentarios";

interface Props {
  findings: Finding[];
  matched: Set<number>;
  activeIndex: number | null;
  appliedMap: Record<number, boolean>;
  onSelectFinding: (i: number) => void;
  onToggleApplied: (i: number) => void;
  cardRefs: React.MutableRefObject<Record<number, HTMLDivElement | null>>;

  hilos: Hilo[];
  yo: string;
  hiloActivo: string | null;
  puedeComentar: boolean;
  onNuevoComentario: () => void;
  onSelectHilo: (id: string) => void;
  onIrAncla: (h: Hilo) => void;
  onResponder: (raizId: string, cuerpo: string) => void;
  onResolver: (id: string, resuelto: boolean) => void;
  onBorrar: (id: string) => void;
}

export function PanelRevision({
  findings,
  matched,
  activeIndex,
  appliedMap,
  onSelectFinding,
  onToggleApplied,
  cardRefs,
  hilos,
  yo,
  hiloActivo,
  puedeComentar,
  onNuevoComentario,
  onSelectHilo,
  onIrAncla,
  onResponder,
  onResolver,
  onBorrar,
}: Props) {
  const [filtro, setFiltro] = useState<Filtro>("todo");

  const abiertos = hilos.filter((h) => !h.raiz.resuelto);
  const resueltos = hilos.filter((h) => h.raiz.resuelto);
  const [verResueltos, setVerResueltos] = useState(false);

  const tabs: { id: Filtro; label: string; n: number }[] = useMemo(
    () => [
      { id: "todo", label: "Todo", n: findings.length + hilos.length },
      { id: "ia", label: "Sugerencias IA", n: findings.length },
      { id: "comentarios", label: "Comentarios", n: hilos.length },
    ],
    [findings.length, hilos.length],
  );

  const showIA = filtro !== "comentarios";
  const showComentarios = filtro !== "ia";

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setFiltro(t.id)}
            className={cn(
              "rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.04em] transition-colors",
              filtro === t.id
                ? "border-transparent bg-ink text-paper"
                : "border-line text-ink-3 hover:text-ink",
            )}
          >
            {t.label} <span className="tabnums opacity-70">{t.n}</span>
          </button>
        ))}
      </div>

      <div className="scroll-fade thin-scroll flex max-h-[560px] flex-col gap-3 overflow-y-auto pr-1 lg:max-h-[calc(100vh-9rem)]">
        {showComentarios && (
          <>
            <div className="flex items-center justify-between">
              <span className="eyebrow flex items-center gap-1.5 text-ink-3">
                <MessagesSquare size={12} /> Comentarios ({hilos.length})
              </span>
              <button
                onClick={onNuevoComentario}
                disabled={!puedeComentar}
                className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.04em] text-accent hover:underline disabled:opacity-40"
              >
                <MessageSquarePlus size={12} /> Nuevo
              </button>
            </div>
            {abiertos.length === 0 && (
              <p className="rounded-lg border border-dashed border-line px-3 py-4 text-center font-mono text-[10.5px] text-ink-3">
                Seleccioná texto del contrato para comentarlo.
              </p>
            )}
            {abiertos.map((h) => (
              <HiloComentario
                key={h.raiz.id}
                hilo={h}
                yo={yo}
                activo={hiloActivo === h.raiz.id}
                onSelect={() => onSelectHilo(h.raiz.id)}
                onIrAlAncla={() => onIrAncla(h)}
                onResponder={(cuerpo) => onResponder(h.raiz.id, cuerpo)}
                onResolver={(r) => onResolver(h.raiz.id, r)}
                onBorrar={onBorrar}
              />
            ))}
            {resueltos.length > 0 && (
              <button
                onClick={() => setVerResueltos((v) => !v)}
                className="font-mono text-[10px] uppercase tracking-[0.04em] text-ink-3 hover:text-ink"
              >
                {verResueltos ? "Ocultar" : "Ver"} {resueltos.length} resueltos
              </button>
            )}
            {verResueltos &&
              resueltos.map((h) => (
                <HiloComentario
                  key={h.raiz.id}
                  hilo={h}
                  yo={yo}
                  activo={hiloActivo === h.raiz.id}
                  onSelect={() => onSelectHilo(h.raiz.id)}
                  onIrAlAncla={() => onIrAncla(h)}
                  onResponder={(cuerpo) => onResponder(h.raiz.id, cuerpo)}
                  onResolver={(r) => onResolver(h.raiz.id, r)}
                  onBorrar={onBorrar}
                />
              ))}
          </>
        )}

        {showIA && showComentarios && <div className="my-1 h-px bg-line" />}

        {showIA && (
          <>
            <div className="flex items-center justify-between">
              <span className="eyebrow flex items-center gap-1.5 text-ink-3">
                <AlertTriangle size={12} /> Puntos a revisar ({findings.length})
              </span>
              {findings.length > 1 && (
                <span className="hidden items-center gap-1 font-mono text-[9.5px] uppercase tracking-[0.04em] text-ink-3 lg:flex">
                  <Kbd>J</Kbd>
                  <Kbd>K</Kbd> · <Kbd>A</Kbd>
                </span>
              )}
            </div>
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
                onSelect={() => onSelectFinding(i)}
                onToggleApplied={() => onToggleApplied(i)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
