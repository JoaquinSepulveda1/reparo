"use client";

import { motion, useReducedMotion } from "framer-motion";
import { scoreColor, scoreGlow } from "@/lib/design/tokens";
import { useCountUp } from "@/lib/hooks/useCountUp";

/** Anillo con el puntaje de riesgo: arco animado + count-up + aura por severidad. */
export function ScoreRing({ score, size = 76 }: { score: number; size?: number }) {
  const reduce = useReducedMotion();
  const n = useCountUp(score);
  const color = scoreColor(score);
  const glow = scoreGlow(score);

  const stroke = size >= 56 ? 3 : 2.5;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.max(0, Math.min(100, score)) / 100);

  return (
    <div
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
    >
      <div
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{ boxShadow: `0 0 ${Math.round(size * 0.5)}px ${glow}` }}
      />
      <svg width={size} height={size} className="absolute -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: reduce ? offset : circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <span
        className="tabnums relative font-serif font-semibold leading-none"
        style={{ color, fontSize: size >= 56 ? Math.round(size * 0.34) : 12 }}
      >
        {n}
      </span>
    </div>
  );
}
