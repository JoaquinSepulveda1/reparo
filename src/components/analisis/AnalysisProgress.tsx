"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/components/ui/cn";

const STAGES = [
  { label: "Leyendo el documento", at: 0 },
  { label: "Cotejando con el marco legal chileno", at: 2600 },
  { label: "Puntuando cláusulas por riesgo", at: 7200 },
  { label: "Redactando sugerencias", at: 12800 },
] as const;

/**
 * Indicador de progreso del análisis. Las etapas avanzan por tiempo estimado
 * (no hay señal real del servidor). Se desmonta cuando llega el resultado.
 */
export function AnalysisProgress({ fileName }: { fileName?: string }) {
  const reduce = useReducedMotion();
  const [stage, setStage] = useState(0);
  const [pct, setPct] = useState(6);

  useEffect(() => {
    const timers = STAGES.map((s, i) =>
      i === 0 ? null : setTimeout(() => setStage(i), s.at),
    );
    const start = Date.now();
    const tick = setInterval(() => {
      // Ease asintótico hacia ~92%.
      const t = Date.now() - start;
      setPct(Math.min(92, 6 + 86 * (1 - Math.exp(-t / 9000))));
    }, 120);
    return () => {
      timers.forEach((t) => t && clearTimeout(t));
      clearInterval(tick);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto max-w-xl py-8"
    >
      <p className="eyebrow mb-2.5">Analizando</p>
      <h1 className="mb-2 font-serif text-[26px] font-medium leading-tight">
        {fileName ? `Revisando ${fileName}` : "Revisando el contrato"}
      </h1>
      <p className="mb-7 text-[14px] text-ink-2">
        Esto puede tardar entre 15 y 30 segundos. No cierres la pestaña.
      </p>

      {/* Barra de progreso */}
      <div className="mb-8 h-1 w-full overflow-hidden rounded-full bg-line">
        <motion.div
          className="h-full rounded-full bg-accent"
          animate={{ width: `${pct}%` }}
          transition={{ ease: "linear", duration: 0.12 }}
        />
      </div>

      <ul className="flex flex-col gap-1">
        {STAGES.map((s, i) => {
          const state = i < stage ? "done" : i === stage ? "active" : "pending";
          return (
            <li
              key={s.label}
              className={cn(
                "flex items-center gap-3 rounded px-3 py-2.5 transition-colors",
                state === "active" && "bg-accent-soft",
              )}
            >
              <span className="grid h-5 w-5 shrink-0 place-items-center">
                {state === "done" && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    className="grid h-5 w-5 place-items-center rounded-full bg-accent text-paper"
                  >
                    <Check size={12} strokeWidth={3} />
                  </motion.span>
                )}
                {state === "active" && <Spinner size={16} className="text-accent" />}
                {state === "pending" && (
                  <span className="h-1.5 w-1.5 rounded-full bg-line-strong" />
                )}
              </span>
              <span
                className={cn(
                  "relative overflow-hidden text-[13.5px]",
                  state === "done" && "text-ink-2",
                  state === "active" && "font-medium text-ink",
                  state === "pending" && "text-ink-3",
                )}
              >
                {s.label}
                {state === "active" && !reduce && (
                  <span
                    className="pointer-events-none absolute inset-0 -z-0"
                    style={{
                      background:
                        "linear-gradient(100deg, transparent 30%, var(--accent-soft) 50%, transparent 70%)",
                      backgroundSize: "200% 100%",
                      animation: "reparo-shimmer 1.6s linear infinite",
                    }}
                  />
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </motion.div>
  );
}
