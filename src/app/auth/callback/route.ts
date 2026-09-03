import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase/server";
import { emailAutorizado } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /auth/callback — destino del magic link. Intercambia el código por sesión
 * (o verifica el token_hash), revalida la lista blanca y entra a la app.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = url.searchParams.get("next");
  const dest = next && next.startsWith("/") ? next : "/";

  const supabase = await createServerSupabase();

  let ok = false;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    ok = !error;
  }

  if (!ok) {
    return NextResponse.redirect(new URL("/login?error=link", url.origin));
  }

  // Revalidar que el email siga autorizado.
  const { data } = await supabase.auth.getUser();
  if (!emailAutorizado(data.user?.email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=no-autorizado", url.origin));
  }

  return NextResponse.redirect(new URL(dest, url.origin));
}
