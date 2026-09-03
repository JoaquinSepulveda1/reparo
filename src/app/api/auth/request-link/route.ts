import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { emailAutorizado } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().email(),
  next: z.string().startsWith("/").max(512).optional(),
});

/**
 * POST /api/auth/request-link  { email, next? }
 * Manda el magic link SOLO si el email está en la lista blanca. La respuesta es
 * siempre la misma (no revela quién está autorizado).
 */
export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Request inválido." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ingresá un email válido." }, { status: 400 });
  }

  const { email, next } = parsed.data;

  if (emailAutorizado(email)) {
    const origin = new URL(req.url).origin;
    const redirectTo = `${origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`;
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) {
      console.error("[/api/auth/request-link] signInWithOtp:", error.message);
    }
  }

  return NextResponse.json({ ok: true });
}
