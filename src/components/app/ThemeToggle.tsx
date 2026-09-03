"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";

/** Alterna claro / oscuro. El icono hace un cross-fade con rotación. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative grid h-8 w-8 place-items-center rounded text-ink-3 transition-colors hover:bg-paper-raised hover:text-ink"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={mounted ? (isDark ? "moon" : "sun") : "placeholder"}
          initial={{ opacity: 0, rotate: -40, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 40, scale: 0.6 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="absolute grid place-items-center"
        >
          {mounted && isDark ? <Moon size={15} /> : <Sun size={15} />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
