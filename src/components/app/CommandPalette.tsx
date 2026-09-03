"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, FileSearch, Library, LogOut, MoonStar, Search } from "lucide-react";
import { Kbd } from "@/components/ui/Kbd";
import { cn } from "@/components/ui/cn";
import { logout } from "@/lib/api";

interface Action {
  id: string;
  label: string;
  hint: string;
  icon: React.ReactNode;
  run: () => void | Promise<void>;
}

/** Paleta de comandos global (⌘K / Ctrl+K). Se monta una sola vez en el layout. */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const reduce = useReducedMotion();

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setCursor(0);
  }, []);

  const actions = useMemo<Action[]>(
    () => [
      {
        id: "analizar",
        label: "Analizar un contrato",
        hint: "Ir al inicio",
        icon: <FileSearch size={15} />,
        run: () => router.push("/"),
      },
      {
        id: "biblioteca",
        label: "Abrir la biblioteca",
        hint: "Contratos revisados",
        icon: <Library size={15} />,
        run: () => router.push("/biblioteca"),
      },
      {
        id: "tema",
        label: resolvedTheme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro",
        hint: "Apariencia",
        icon: <MoonStar size={15} />,
        run: () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
      },
      {
        id: "salir",
        label: "Cerrar sesión",
        hint: "Salir de Reparo",
        icon: <LogOut size={15} />,
        run: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ],
    [router, resolvedTheme, setTheme],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter(
      (a) => a.label.toLowerCase().includes(q) || a.hint.toLowerCase().includes(q),
    );
  }, [actions, query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onToggle = () => setOpen((o) => !o);
    window.addEventListener("keydown", onKey);
    window.addEventListener("reparo:command-palette", onToggle);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("reparo:command-palette", onToggle);
    };
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => {
        cancelAnimationFrame(id);
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  useEffect(() => {
    setCursor((c) => Math.min(c, Math.max(0, results.length - 1)));
  }, [results.length]);

  async function choose(a?: Action) {
    if (!a) return;
    close();
    await a.run();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (results.length === 0) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => (c + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => (c - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(results[cursor]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[14vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={close}
          style={{ background: "color-mix(in srgb, var(--ink) 28%, transparent)" }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Paleta de comandos"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={onKeyDown}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="glass w-full max-w-lg overflow-hidden rounded-lg border shadow-lg"
          >
            <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
              <Search size={15} className="shrink-0 text-ink-3" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar una acción…"
                className="w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-3"
              />
              <Kbd>Esc</Kbd>
            </div>

            <ul className="max-h-[52vh] overflow-y-auto p-1.5 thin-scroll">
              {results.length === 0 && (
                <li className="px-3 py-6 text-center font-mono text-[11px] text-ink-3">
                  Sin resultados
                </li>
              )}
              {results.map((a, i) => (
                <li key={a.id}>
                  <button
                    onMouseMove={() => setCursor(i)}
                    onClick={() => choose(a)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded px-3 py-2.5 text-left transition-colors",
                      i === cursor ? "bg-accent-soft text-ink" : "text-ink-2",
                    )}
                  >
                    <span className={cn(i === cursor ? "text-accent" : "text-ink-3")}>{a.icon}</span>
                    <span className="flex-1">
                      <span className="block text-[13.5px] leading-tight">{a.label}</span>
                      <span className="block font-mono text-[10px] uppercase tracking-eyebrow text-ink-3">
                        {a.hint}
                      </span>
                    </span>
                    {i === cursor && <ArrowRight size={14} className="text-accent" />}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
