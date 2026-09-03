"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { Wordmark } from "@/components/brand/Logo";
import { AmbientBackground } from "@/components/brand/AmbientBackground";
import { Button } from "@/components/ui/Button";
import { DISCLAIMER } from "@/lib/contrato/constantes";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "No se pudo iniciar sesión.");
        setLoading(false);
        return;
      }
      router.replace(next);
    } catch {
      setError("No se pudo conectar. Intentá de nuevo.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-3">
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña compartida"
          className="w-full rounded border border-line bg-paper-raised px-4 py-3 pr-11 font-sans text-[14.5px] text-ink outline-none transition-colors focus:border-ink-3"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded text-ink-3 transition-colors hover:text-ink"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {error && <p className="text-[13px] text-redline">{error}</p>}
      <Button type="submit" disabled={!password} loading={loading}>
        {loading ? "Verificando…" : "Entrar"}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <AmbientBackground />
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="glass w-full max-w-md rounded-lg border p-8 shadow-lg sm:p-10"
      >
        <Wordmark />
        <p className="eyebrow mt-8">Acceso</p>
        <h1 className="mt-2 font-serif text-[26px] font-medium leading-tight">
          Ingresá la contraseña del equipo
        </h1>

        <Suspense fallback={<div className="mt-8 h-24" />}>
          <LoginForm />
        </Suspense>

        <p className="mt-10 font-mono text-[11px] leading-relaxed text-ink-3">{DISCLAIMER}</p>
      </motion.div>
    </main>
  );
}
