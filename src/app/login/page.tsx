"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Wordmark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { DISCLAIMER } from "@/lib/contrato/constantes";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  const [password, setPassword] = useState("");
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
      <input
        type="password"
        autoFocus
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Contraseña compartida"
        className="w-full rounded border border-line bg-paper-raised px-4 py-3 font-sans text-[14.5px] text-ink outline-none focus:border-ink"
      />
      {error && <p className="text-[13px] text-redline">{error}</p>}
      <Button type="submit" disabled={!password || loading}>
        {loading ? "Verificando…" : "Entrar"}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <Wordmark />
      <p className="eyebrow mt-8">Acceso</p>
      <h1 className="mt-2 font-serif text-[28px] font-medium">
        Ingresá la contraseña del equipo
      </h1>

      <Suspense fallback={<div className="mt-8 h-24" />}>
        <LoginForm />
      </Suspense>

      <p className="mt-10 font-mono text-[11px] text-ink-3">{DISCLAIMER}</p>
    </main>
  );
}
