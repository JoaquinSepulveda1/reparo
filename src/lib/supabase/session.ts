import "server-only";
import { createServerSupabase } from "./server";
import { emailAutorizado } from "@/lib/env";

export interface SessionUser {
  id: string;
  email: string;
  /** Nombre para mostrar: `user_metadata.name` o la parte local del email. */
  nombre: string;
}

/**
 * Usuario de la sesión actual, o `null` si no hay o el email no está en la lista
 * blanca. Los API routes lo usan para cortar 401 y estampar autoría.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.getUser();
  const user = data?.user;
  if (error || !user?.email || !emailAutorizado(user.email)) return null;

  const metaName =
    (user.user_metadata?.name as string | undefined) ||
    (user.user_metadata?.full_name as string | undefined);
  return {
    id: user.id,
    email: user.email,
    nombre: metaName?.trim() || user.email.split("@")[0],
  };
}
