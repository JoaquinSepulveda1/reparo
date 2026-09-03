"use client";

import { useEffect, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";

/**
 * Anima un número de 0 → `value` una vez (y en cada cambio de `value`).
 * Con `prefers-reduced-motion` salta directo al valor final.
 */
export function useCountUp(value: number, duration = 0.9): number {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, duration, reduce]);

  return display;
}
