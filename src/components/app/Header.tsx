"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
import { Wordmark } from "@/components/brand/Logo";
import { ThemeToggle } from "./ThemeToggle";
import { Kbd } from "@/components/ui/Kbd";
import { cn } from "@/components/ui/cn";
import { logout } from "@/lib/api";

const links = [
  { href: "/", label: "Analizar" },
  { href: "/biblioteca", label: "Biblioteca" },
];

function openCommandPalette() {
  window.dispatchEvent(new CustomEvent("reparo:command-palette"));
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function onLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-shadow duration-300",
        scrolled ? "glass border-b shadow-sm" : "border-b border-transparent bg-paper",
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="rounded" aria-label="Reparo — inicio">
          <Wordmark />
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <nav className="flex items-center">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "relative rounded px-3 py-1.5 font-mono text-[11px] uppercase tracking-eyebrow transition-colors",
                    active ? "text-ink" : "text-ink-3 hover:text-ink",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 -z-10 rounded bg-paper-raised shadow-sm"
                      transition={{ type: "spring", stiffness: 400, damping: 34 }}
                    />
                  )}
                  {l.label}
                </Link>
              );
            })}
          </nav>

          <span className="mx-1 hidden h-4 w-px bg-line sm:block" />

          <button
            onClick={openCommandPalette}
            className="hidden items-center gap-2 rounded border border-line px-2.5 py-1.5 text-ink-3 transition-colors hover:border-line-strong hover:text-ink sm:flex"
            aria-label="Abrir la paleta de comandos"
          >
            <span className="font-mono text-[10px] uppercase tracking-eyebrow">Comandos</span>
            <Kbd>⌘K</Kbd>
          </button>

          <ThemeToggle />

          <button
            onClick={onLogout}
            aria-label="Cerrar sesión"
            className="grid h-8 w-8 place-items-center rounded text-ink-3 transition-colors hover:bg-paper-raised hover:text-redline"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
