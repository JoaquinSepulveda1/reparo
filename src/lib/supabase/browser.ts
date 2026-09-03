"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para el browser. Solo se usa para el flujo de auth
 * (magic link, leer la sesión, cerrar sesión). Toda la data de la app pasa por
 * los API routes del servidor.
 */
export function getSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
