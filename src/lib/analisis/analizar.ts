import "server-only";
import { Type, type Schema } from "@google/genai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getGemini } from "@/lib/gemini";
import { env } from "@/lib/env";
import { CHUNK_CHARS, MAX_CHARS_TOTAL, MAX_CHUNKS } from "@/lib/contrato/constantes";
import { dividirEnChunks } from "@/lib/contrato/chunking";
import { normalizeChars } from "@/lib/contrato/matching";
import { construirSystemPrompt, construirUserPrompt } from "./prompt";
import { getPrecedentsDigest } from "./precedentes";
import {
  parseAnalisis,
  AnalisisModeloError,
  type AnalisisDominio,
  type FindingDominio,
} from "./schema";

export { AnalisisParseError, AnalisisModeloError } from "./schema";

export interface AnalizarResultado extends AnalisisDominio {
  /** true si el análisis usó precedentes de contratos anteriores. */
  uso_precedentes: boolean;
  /** En cuántos trozos se analizó el contrato. */
  chunks: number;
}

/**
 * Schema de salida para Gemini (structured output). Mismas claves inglesas que
 * pide el prompt; `schema.ts` después valida con zod y mapea al dominio español.
 */
const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    overall_risk_score: { type: Type.INTEGER },
    summary: { type: Type.STRING },
    findings: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          excerpt: { type: Type.STRING },
          category: { type: Type.STRING },
          risk_level: { type: Type.STRING, enum: ["alto", "medio", "bajo"] },
          risk_score: { type: Type.INTEGER },
          issue: { type: Type.STRING },
          suggestion: { type: Type.STRING },
          redraft: { type: Type.STRING },
        },
        required: ["excerpt", "category", "risk_level", "risk_score", "issue", "suggestion", "redraft"],
        propertyOrdering: [
          "excerpt",
          "category",
          "risk_level",
          "risk_score",
          "issue",
          "suggestion",
          "redraft",
        ],
      },
    },
  },
  required: ["overall_risk_score", "summary", "findings"],
  propertyOrdering: ["overall_risk_score", "summary", "findings"],
};

/**
 * Pipeline completo de un análisis:
 *  1. trunca el contrato a MAX_CHARS_TOTAL y lo parte en hasta MAX_CHUNKS trozos
 *  2. consulta precedentes (últimos 3 contratos guardados) en Postgres
 *  3. llama a Gemini una vez por trozo, EN PARALELO (structured output), con un
 *     reintento por trozo que falle
 *  4. fusiona los resultados de todos los trozos en un único análisis
 *
 * No persiste nada: guardar en la biblioteca es un paso aparte (POST /api/contratos).
 */
export async function analizarContrato(
  supabase: SupabaseClient,
  contractTextRaw: string,
): Promise<AnalizarResultado> {
  const contractText = contractTextRaw.slice(0, MAX_CHARS_TOTAL);
  const chunks = dividirEnChunks(contractText, {
    chunkChars: CHUNK_CHARS,
    maxChunks: MAX_CHUNKS,
  });
  if (chunks.length === 0) {
    throw new AnalisisModeloError("El contrato viene vacío.");
  }

  const precedentsDigest = await getPrecedentsDigest(supabase);
  const system = construirSystemPrompt(precedentsDigest);
  const ai = getGemini();
  const model = env.geminiModel();

  const parciales = await Promise.all(
    chunks.map((chunk) =>
      conReintento(() => analizarChunk(ai, model, system, chunk)),
    ),
  );

  const merged = fusionar(parciales);
  return {
    ...merged,
    uso_precedentes: precedentsDigest.length > 0,
    chunks: chunks.length,
  };
}

/** Una llamada a Gemini para un trozo del contrato. */
async function analizarChunk(
  ai: ReturnType<typeof getGemini>,
  model: string,
  system: string,
  chunkText: string,
): Promise<AnalisisDominio> {
  const response = await ai.models.generateContent({
    model,
    contents: construirUserPrompt(chunkText),
    config: {
      systemInstruction: system,
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.2,
      maxOutputTokens: 8192,
      // Gemini piensa por defecto; acotamos el presupuesto para que el "pensar"
      // no se coma el cupo de salida y trunque el JSON.
      thinkingConfig: { thinkingBudget: 2048 },
    },
  });

  const blockReason = response.promptFeedback?.blockReason;
  if (blockReason) {
    throw new AnalisisModeloError(
      `El modelo rechazó el contrato antes de analizarlo (${blockReason}).`,
    );
  }

  const finishReason = response.candidates?.[0]?.finishReason;
  if (finishReason && finishReason !== "STOP") {
    throw new AnalisisModeloError(
      finishReason === "MAX_TOKENS"
        ? "La respuesta se cortó por límite de tokens. Probá con un contrato más corto."
        : `El modelo interrumpió la respuesta (${finishReason}).`,
    );
  }

  const text = response.text?.trim();
  if (!text) {
    throw new AnalisisModeloError("El modelo devolvió una respuesta vacía.");
  }

  return parseAnalisis(text);
}

/** Reintenta una vez, con una pausa corta, ante cualquier error. */
async function conReintento<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch {
    await new Promise((r) => setTimeout(r, 800));
    return fn();
  }
}

/**
 * Fusiona los análisis parciales de cada trozo en uno solo:
 *  - findings: se juntan, se descartan duplicados por excerpt (gana el de mayor
 *    score), se ordenan por riesgo y se recortan a 10
 *  - score_general: el máximo pesa 0.7 y el promedio 0.3 (una cláusula roja en
 *    8 páginas no debería llevar el global a 95)
 *  - resumen: el del trozo con mayor score
 */
function fusionar(parciales: AnalisisDominio[]): AnalisisDominio {
  if (parciales.length === 1) return parciales[0];

  const porExcerpt = new Map<string, FindingDominio>();
  for (const p of parciales) {
    for (const f of p.findings) {
      const clave = normalizeChars(f.excerpt).toLowerCase().replace(/\s+/g, " ").trim();
      const previo = porExcerpt.get(clave);
      if (!previo || f.score_riesgo > previo.score_riesgo) porExcerpt.set(clave, f);
    }
  }
  const findings = [...porExcerpt.values()]
    .sort((a, b) => b.score_riesgo - a.score_riesgo)
    .slice(0, 10);

  const scores = parciales.map((p) => p.score_general);
  const max = Math.max(...scores);
  const prom = scores.reduce((a, b) => a + b, 0) / scores.length;
  const score_general = Math.min(100, Math.round(max * 0.7 + prom * 0.3));

  const resumen = [...parciales].sort((a, b) => b.score_general - a.score_general)[0].resumen;

  return { score_general, resumen, findings };
}
