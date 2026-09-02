import { NextResponse } from "next/server";
import { ApiError } from "@google/genai";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  analizarContrato,
  AnalisisParseError,
  AnalisisModeloError,
} from "@/lib/analisis/analizar";
import { MAX_CHARS } from "@/lib/contrato/constantes";

// La llamada a Gemini puede tardar: forzamos runtime Node y sin cache.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodySchema = z.object({
  texto: z.string().min(1, "El contrato viene vacío.").transform((t) => t.trim()),
  nombreArchivo: z.string().max(300).optional(),
});

/**
 * POST /api/analizar
 * body: { texto: string, nombreArchivo?: string }
 *
 * Llama a Gemini SOLO desde el servidor. Antes inyecta los precedentes de los
 * últimos 3 contratos guardados (ver getPrecedentsDigest). No guarda nada:
 * persistir es un paso aparte.
 */
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
  if (!parsed.data.texto) {
    return NextResponse.json({ error: "El contrato viene vacío." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const resultado = await analizarContrato(supabase, parsed.data.texto);

    return NextResponse.json({
      ...resultado,
      meta: {
        truncado: parsed.data.texto.length > MAX_CHARS,
        chars_analizados: Math.min(parsed.data.texto.length, MAX_CHARS),
        nombre_archivo: parsed.data.nombreArchivo ?? null,
      },
    });
  } catch (err) {
    // 1) El modelo respondió pero el JSON no se puede interpretar.
    if (err instanceof AnalisisParseError) {
      return NextResponse.json(
        {
          error:
            "No pude interpretar la respuesta del modelo. Probá de nuevo; si sigue fallando, revisá el texto del contrato.",
          detalle: err.message,
          respuesta_cruda: err.raw.slice(0, 2000),
        },
        { status: 422 },
      );
    }

    // 2) El modelo respondió pero de forma inutilizable (bloqueo, truncado, vacío).
    if (err instanceof AnalisisModeloError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }

    // 3) Error de la API de Gemini.
    if (err instanceof ApiError) {
      const status = err.status === 429 ? 429 : 502;
      return NextResponse.json(
        {
          error:
            err.status === 429
              ? "El servicio está saturado ahora mismo (cuota de Gemini). Esperá unos segundos y reintentá."
              : "El servicio de análisis respondió con un error. Intentá de nuevo en unos segundos.",
          detalle: err.message,
        },
        { status },
      );
    }

    // 4) Config faltante (env vars) u otro error inesperado.
    console.error("[/api/analizar] error inesperado:", err);
    return NextResponse.json(
      { error: "Ocurrió un error inesperado al analizar el contrato." },
      { status: 500 },
    );
  }
}
