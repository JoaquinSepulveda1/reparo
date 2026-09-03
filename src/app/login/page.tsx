"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, CheckCircle2 } from "lucide-react";
import { Wordmark } from "@/components/brand/Logo";
import { AmbientBackground } from "@/components/brand/AmbientBackground";
import { Button } from "@/components/ui/Button";
import { DISCLAIMER } from "@/lib/contrato/constantes";

const MENSAJE_ERROR: Record<string, string> = {
  link: "El enlace no es válido o ya se usó. Pedí uno nuevo.",
  "no-autorizado": "Ese correo no está autorizado para entrar a Reparo.",
};

function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const errorParam = params.get("error");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState(errorParam ? MENSAJE_ERROR[errorParam] ?? "" : "");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "No se pudo enviar el enlace.");
        setLoading(false);
        return;
      }
      setEnviado(true);
    } catch {
      setError("No se pudo conectar. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (enviado) {
    return (
      <div className="mt-8 flex flex-col items-start gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent">
          <CheckCircle2 size={20} />
        </span>
        <p className="text-[14px] text-ink-2">
          Si <span className="font-medium text-ink">{email}</span> está autorizado, te llegó un
          enlace para entrar. Revisá tu correo (y el spam).
        </p>
        <button
          onClick={() => {
            setEnviado(false);
            setEmail("");
          }}
          className="font-mono text-[11px] uppercase tracking-eyebrow text-ink-3 transition-colors hover:text-ink"
        >
          Usar otro correo
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-3">
      <div className="relative">
        <Mail
          size={15}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3"
        />
        <input
          type="email"
          autoFocus
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          className="w-full rounded border border-line bg-paper-raised py-3 pl-10 pr-4 font-sans text-[14.5px] text-ink outline-none transition-colors focus:border-ink-3"
        />
      </div>
      {error && <p className="text-[13px] text-redline">{error}</p>}
      <Button type="submit" disabled={!email} loading={loading}>
        {loading ? "Enviando…" : "Enviar enlace de acceso"}
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
          Entrá con tu correo
        </h1>
        <p className="mt-2 text-[13.5px] text-ink-3">
          Te mandamos un enlace de un solo uso. Sin contraseñas.
        </p>

        <Suspense fallback={<div className="mt-8 h-24" />}>
          <LoginForm />
        </Suspense>

        <p className="mt-10 font-mono text-[11px] leading-relaxed text-ink-3">{DISCLAIMER}</p>
      </motion.div>
    </main>
  );
}
