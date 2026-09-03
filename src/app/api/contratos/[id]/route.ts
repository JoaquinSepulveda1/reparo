import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/supabase/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const patchSchema = z
  .object({
    nombre_archivo: z.string().trim().min(1).max(300).optional(),
    texto_editado: z.string().nullable().optional(),
    estado: z.enum(["borrador", "aprobado"]).optional(),
    findings_aplicada: z
      .array(z.object({ excerpt: z.string().min(1), aplicada: z.boolean() }))
      .optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "Nada para actualizar." });

/**
 * PATCH /api/contratos/:id — actualización parcial: renombrar, guardar
 * texto_editado, aplicar/desaplicar findings, dar visto bueno o reabrir.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

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
  const d = parsed.data;
  const supabase = getSupabaseAdmin();

  const update: Record<string, unknown> = { actualizado_en: new Date().toISOString() };
  if (d.nombre_archivo !== undefined) update.nombre_archivo = d.nombre_archivo;
  if (d.texto_editado !== undefined) update.texto_editado = d.texto_editado;
  if (d.estado === "aprobado") {
    update.estado = "aprobado";
    update.aprobado_por = user.email;
    update.aprobado_en = new Date().toISOString();
  } else if (d.estado === "borrador") {
    update.estado = "borrador";
    update.aprobado_por = null;
    update.aprobado_en = null;
  }

  const { error } = await supabase.from("contratos").update(update).eq("id", id);
  if (error) {
    console.error("[/api/contratos/:id] patch contrato:", error);
    return NextResponse.json({ error: "No se pudo actualizar el análisis." }, { status: 500 });
  }

  if (d.findings_aplicada?.length) {
    for (const f of d.findings_aplicada) {
      const { error: e2 } = await supabase
        .from("findings")
        .update({ aplicada: f.aplicada })
        .eq("contrato_id", id)
        .eq("excerpt", f.excerpt);
      if (e2) {
        console.error("[/api/contratos/:id] patch findings:", e2);
        return NextResponse.json(
          { error: "No se pudieron actualizar los cambios aplicados." },
          { status: 500 },
        );
      }
    }
  }

  return NextResponse.json({ ok: true });
}

/** DELETE /api/contratos/:id → borra el contrato (los findings caen por cascade). */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

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
