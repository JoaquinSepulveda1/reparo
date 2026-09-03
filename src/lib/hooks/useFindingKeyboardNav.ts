"use client";

import { useEffect } from "react";

interface Options {
  count: number;
  activeIndex: number | null;
  setActiveIndex: (i: number) => void;
  onJump: (i: number) => void;
  onToggleApply: (i: number) => void;
  enabled?: boolean;
}

function typingInField() {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
}

/**
 * Navegación por teclado de la lista de findings:
 *  j / ↓  y  k / ↑  → mover el finding activo
 *  Enter          → saltar el documento a su highlight
 *  a              → aplicar / desaplicar el cambio
 */
export function useFindingKeyboardNav({
  count,
  activeIndex,
  setActiveIndex,
  onJump,
  onToggleApply,
  enabled = true,
}: Options) {
  useEffect(() => {
    if (!enabled || count === 0) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || typingInField()) return;
      const cur = activeIndex ?? 0;

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex(Math.min(count - 1, cur + 1));
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex(Math.max(0, cur - 1));
      } else if (e.key === "Enter") {
        if (activeIndex != null) {
          e.preventDefault();
          onJump(activeIndex);
        }
      } else if (e.key === "a" || e.key === "A") {
        if (activeIndex != null) {
          e.preventDefault();
          onToggleApply(activeIndex);
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, count, activeIndex, setActiveIndex, onJump, onToggleApply]);
}
