import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const patchSchema = z.object({
  nombre_archivo: z.string().trim().min(1).max(300),
});

/** PATCH /api/contratos/:id → por ahora, renombrar. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!UUID.test(id)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "El cuerpo del request no es JSON válido." }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Request inválido." },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("contratos")
    .update({ nombre_archivo: parsed.data.nombre_archivo })
    .eq("id", id);

  if (error) {
    console.error("[/api/contratos/:id] patch:", error);
    return NextResponse.json({ error: "No se pudo actualizar el análisis." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

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
