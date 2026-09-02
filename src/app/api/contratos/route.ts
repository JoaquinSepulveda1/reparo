import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const findingSchema = z.object({
  excerpt: z.string().min(1),
  categoria: z.string().nullable().optional(),
  nivel_riesgo: z.enum(["alto", "medio", "bajo"]).nullable().optional(),
  score_riesgo: z.number().int().min(0).max(100).nullable().optional(),
  problema: z.string().nullable().optional(),
  sugerencia: z.string().nullable().optional(),
  nueva_redaccion: z.string().nullable().optional(),
  aplicada: z.boolean().default(false),
});

const bodySchema = z.object({
  nombre_archivo: z.string().max(300).nullable().optional(),
  texto_original: z.string().min(1),
  texto_editado: z.string().nullable().optional(),
  score_general: z.number().int().min(0).max(100).nullable().optional(),
  resumen: z.string().nullable().optional(),
  findings: z.array(findingSchema).default([]),
});

/** POST /api/contratos → guarda contrato + findings en la biblioteca. */
export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "El cuerpo del request no es JSON válido." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Request inválido." },
      { status: 400 },
    );
  }
  const d = parsed.data;
  const supabase = getSupabaseAdmin();

  const { data: contrato, error: e1 } = await supabase
    .from("contratos")
    .insert({
      nombre_archivo: d.nombre_archivo ?? null,
      texto_original: d.texto_original,
      texto_editado: d.texto_editado ?? null,
      score_general: d.score_general ?? null,
      resumen: d.resumen ?? null,
    })
    .select("id")
    .single();

  if (e1 || !contrato) {
    console.error("[/api/contratos] insert contrato:", e1);
    return NextResponse.json({ error: "No se pudo guardar el contrato." }, { status: 500 });
  }

  if (d.findings.length > 0) {
    const { error: e2 } = await supabase.from("findings").insert(
      d.findings.map((f) => ({
        contrato_id: contrato.id,
        excerpt: f.excerpt,
        categoria: f.categoria ?? null,
        nivel_riesgo: f.nivel_riesgo ?? null,
        score_riesgo: f.score_riesgo ?? null,
        problema: f.problema ?? null,
        sugerencia: f.sugerencia ?? null,
        nueva_redaccion: f.nueva_redaccion ?? null,
        aplicada: f.aplicada,
      })),
    );
    if (e2) {
      console.error("[/api/contratos] insert findings:", e2);
      await supabase.from("contratos").delete().eq("id", contrato.id);
      return NextResponse.json({ error: "No se pudieron guardar los hallazgos." }, { status: 500 });
    }
  }

  return NextResponse.json({ id: contrato.id }, { status: 201 });
}

interface ContratoConFindings {
  id: string;
  created_at: string;
  nombre_archivo: string | null;
  texto_original: string;
  texto_editado: string | null;
  score_general: number | null;
  resumen: string | null;
  findings: Array<{
    id: string;
    excerpt: string;
    categoria: string | null;
    nivel_riesgo: "alto" | "medio" | "bajo" | null;
    score_riesgo: number | null;
    problema: string | null;
    sugerencia: string | null;
    nueva_redaccion: string | null;
    aplicada: boolean;
  }>;
}

/** GET /api/contratos → lista de contratos guardados con sus findings. */
export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("contratos")
    .select(
      "id, created_at, nombre_archivo, texto_original, texto_editado, score_general, resumen, findings(id, excerpt, categoria, nivel_riesgo, score_riesgo, problema, sugerencia, nueva_redaccion, aplicada)",
    )
    .order("created_at", { ascending: false })
    .returns<ContratoConFindings[]>();

  if (error) {
    console.error("[/api/contratos] select:", error);
    return NextResponse.json({ error: "No se pudo cargar la biblioteca." }, { status: 500 });
  }

  return NextResponse.json({ contratos: data ?? [] });
}
