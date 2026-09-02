"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Wordmark } from "@/components/brand/Logo";
import { cn } from "@/components/ui/cn";
import { logout } from "@/lib/api";

const links = [
  { href: "/", label: "Analizar" },
  { href: "/biblioteca", label: "Biblioteca" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();

  async function onLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <header className="flex items-center justify-between border-b border-line px-6 py-4">
      <Link href="/">
        <Wordmark />
      </Link>
      <nav className="flex items-center gap-5">
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "font-mono text-[11.5px] uppercase tracking-eyebrow",
                active ? "font-semibold text-ink" : "text-ink-3 hover:text-ink",
              )}
            >
              {l.label}
            </Link>
          );
        })}
        <button
          onClick={onLogout}
          className="font-mono text-[11.5px] uppercase tracking-eyebrow text-ink-3 hover:text-redline"
        >
          Salir
        </button>
      </nav>
    </header>
  );
}
