import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Cliente de Supabase para uso EXCLUSIVO en el servidor.
 * Usa la service role key → bypassa RLS. Nunca importar esto desde un
 * componente cliente ni exponer la key al browser.
 *
 * Sin tipos generados: las 2 tablas son chicas y el acceso está acotado a este
 * repo. Las lecturas se tipan con `.returns<T>()` y las escrituras se validan
 * con zod en cada API route.
 */
let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;
  cached = createClient(env.supabaseUrl(), env.supabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
