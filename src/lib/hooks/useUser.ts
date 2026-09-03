"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

export interface UsuarioActual {
  email: string;
  nombre: string;
}

/** Usuario logueado en el browser (para el header / paleta). `null` mientras carga o si no hay. */
export function useUser(): UsuarioActual | null {
  const [user, setUser] = useState<UsuarioActual | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    let activo = true;

    const mapear = (u: { email?: string; user_metadata?: Record<string, unknown> } | null) => {
      if (!u?.email) return null;
      const meta =
        (u.user_metadata?.name as string | undefined) ||
        (u.user_metadata?.full_name as string | undefined);
      return { email: u.email, nombre: meta?.trim() || u.email.split("@")[0] };
    };

    supabase.auth.getUser().then(({ data }) => {
      if (activo) setUser(mapear(data.user));
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(mapear(session?.user ?? null));
    });

    return () => {
      activo = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return user;
}
