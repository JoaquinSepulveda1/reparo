import "server-only";
import { cookies } from "next/headers";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";

/**
 * Cliente ADMIN (service role) → bypassa RLS. Uso exclusivo server, para las
 * escrituras/lecturas de datos de la app. Nunca exponer la key al browser.
 */
let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;
  cached = createClient(env.supabaseUrl(), env.supabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

/**
 * Cliente ligado a la sesión del usuario (cookies). Se usa para `auth.getUser()`
 * en route handlers / server components y para el intercambio del magic link.
 */
export async function createServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(env.supabaseUrl(), env.supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Llamado desde un Server Component: no puede escribir cookies. El
          // middleware ya refresca la sesión, así que es seguro ignorarlo.
        }
      },
    },
  });
}
