import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/supabase/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const postSchema = z.object({
  cuerpo: z.string().trim().min(1).max(4000),
  parent_id: z.string().regex(UUID).nullable().optional(),
  rango_inicio: z.number().int().min(0).nullable().optional(),
  rango_fin: z.number().int().min(0).nullable().optional(),
  excerpt: z.string().max(1000).nullable().optional(),
});

/** GET /api/contratos/:id/comentarios → todos los comentarios del contrato. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("comentarios")
    .select(
      "id, contrato_id, parent_id, autor_email, autor_nombre, cuerpo, rango_inicio, rango_fin, excerpt, resuelto, resuelto_por, created_at",
    )
    .eq("contrato_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[comentarios GET]", error);
    return NextResponse.json({ error: "No se pudieron cargar los comentarios." }, { status: 500 });
  }

  return NextResponse.json({ comentarios: data ?? [], yo: user.email });
}

/** POST /api/contratos/:id/comentarios → crea un comentario o una respuesta. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Request inválido." }, { status: 400 });
  }

  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Request inválido." },
      { status: 400 },
    );
  }
  const d = parsed.data;
  const supabase = getSupabaseAdmin();

  // El contrato tiene que existir.
  const { data: contrato } = await supabase
    .from("contratos")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (!contrato) {
    return NextResponse.json({ error: "El contrato no existe." }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("comentarios")
    .insert({
      contrato_id: id,
      parent_id: d.parent_id ?? null,
      autor_email: user.email,
      autor_nombre: user.nombre,
      cuerpo: d.cuerpo,
      rango_inicio: d.rango_inicio ?? null,
      rango_fin: d.rango_fin ?? null,
      excerpt: d.excerpt ?? null,
    })
    .select(
      "id, contrato_id, parent_id, autor_email, autor_nombre, cuerpo, rango_inicio, rango_fin, excerpt, resuelto, resuelto_por, created_at",
    )
    .single();

  if (error || !data) {
    console.error("[comentarios POST]", error);
    return NextResponse.json({ error: "No se pudo guardar el comentario." }, { status: 500 });
  }

  return NextResponse.json({ comentario: data }, { status: 201 });
}
