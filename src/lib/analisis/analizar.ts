import "server-only";
import { Type, type Schema } from "@google/genai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getGemini } from "@/lib/gemini";
import { env } from "@/lib/env";
import { MAX_CHARS } from "@/lib/contrato/constantes";
import { construirSystemPrompt, construirUserPrompt } from "./prompt";
import { getPrecedentsDigest } from "./precedentes";
import { parseAnalisis, AnalisisModeloError, type AnalisisDominio } from "./schema";

export { AnalisisParseError, AnalisisModeloError } from "./schema";

export interface AnalizarResultado extends AnalisisDominio {
  /** true si el análisis usó precedentes de contratos anteriores. */
  uso_precedentes: boolean;
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
 *  1. trunca el contrato a MAX_CHARS
 *  2. consulta precedentes (últimos 3 contratos guardados) en Postgres
 *  3. llama a Gemini con el prompt replicado del prototipo + structured output
 *  4. valida el JSON (lanza AnalisisParseError si no calza / AnalisisModeloError
 *     si vino bloqueado, vacío o truncado)
 *
 * No persiste nada: guardar en la biblioteca es un paso aparte (POST /api/contratos).
 */
export async function analizarContrato(
  supabase: SupabaseClient,
  contractTextRaw: string,
): Promise<AnalizarResultado> {
  const contractText = contractTextRaw.slice(0, MAX_CHARS);

  const precedentsDigest = await getPrecedentsDigest(supabase);
  const system = construirSystemPrompt(precedentsDigest);

  const ai = getGemini();
  const response = await ai.models.generateContent({
    model: env.geminiModel(),
    contents: construirUserPrompt(contractText),
    config: {
      systemInstruction: system,
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.2,
      maxOutputTokens: 8192,
      // Gemini 2.5 piensa por defecto; acotamos el presupuesto para que el
      // "pensar" no se coma el cupo de salida y trunque el JSON.
      thinkingConfig: { thinkingBudget: 2048 },
    },
  });

  // ¿Prompt bloqueado antes de generar?
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

  const dominio = parseAnalisis(text);
  return { ...dominio, uso_precedentes: precedentsDigest.length > 0 };
}
