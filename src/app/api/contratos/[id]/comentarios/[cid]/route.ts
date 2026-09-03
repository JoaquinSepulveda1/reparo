import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/supabase/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const patchSchema = z.object({ resuelto: z.boolean() });

/** PATCH /api/contratos/:id/comentarios/:cid → resolver / reabrir un hilo. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; cid: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const { id, cid } = await params;
  if (!UUID.test(id) || !UUID.test(cid)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Request inválido." }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Request inválido." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("comentarios")
    .update({
      resuelto: parsed.data.resuelto,
      resuelto_por: parsed.data.resuelto ? user.email : null,
    })
    .eq("id", cid)
    .eq("contrato_id", id);

  if (error) {
    console.error("[comentarios PATCH]", error);
    return NextResponse.json({ error: "No se pudo actualizar el comentario." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

/** DELETE /api/contratos/:id/comentarios/:cid → borra el comentario (solo el autor). */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; cid: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const { id, cid } = await params;
  if (!UUID.test(id) || !UUID.test(cid)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: row } = await supabase
    .from("comentarios")
    .select("autor_email")
    .eq("id", cid)
    .eq("contrato_id", id)
    .maybeSingle();

  if (!row) return NextResponse.json({ error: "No existe." }, { status: 404 });
  if (row.autor_email !== user.email) {
    return NextResponse.json({ error: "Solo el autor puede borrar su comentario." }, { status: 403 });
  }

  const { error } = await supabase.from("comentarios").delete().eq("id", cid);
  if (error) {
    console.error("[comentarios DELETE]", error);
    return NextResponse.json({ error: "No se pudo borrar el comentario." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
