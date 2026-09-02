import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** DELETE /api/contratos/:id → borra el contrato (los findings caen por cascade). */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!UUID.test(id)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("contratos").delete().eq("id", id);
  if (error) {
    console.error("[/api/contratos/:id] delete:", error);
    return NextResponse.json({ error: "No se pudo eliminar el análisis." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
