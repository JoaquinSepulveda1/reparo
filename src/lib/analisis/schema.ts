import { z } from "zod";

/**
 * El prompt (ver prompt.ts) le pide al modelo un JSON con claves en inglés.
 * Acá lo validamos y lo mapeamos al vocabulario del dominio (español), que es
 * el que usan la BD y el frontend.
 */

const nivel = z.enum(["alto", "medio", "bajo"]);

const findingModelSchema = z.object({
  excerpt: z.string().min(1),
  category: z.string().min(1),
  risk_level: nivel,
  risk_score: z.coerce.number().int().min(0).max(100),
  issue: z.string().min(1),
  suggestion: z.string().min(1),
  redraft: z.string().min(1),
});

export const analisisModelSchema = z.object({
  overall_risk_score: z.coerce.number().int().min(0).max(100),
  summary: z.string().min(1),
  findings: z.array(findingModelSchema).max(12),
});

export type AnalisisModel = z.infer<typeof analisisModelSchema>;

/** Shape de dominio: lo que devuelve /api/analizar y lo que se guarda en la BD. */
export interface FindingDominio {
  excerpt: string;
  categoria: string;
  nivel_riesgo: "alto" | "medio" | "bajo";
  score_riesgo: number;
  problema: string;
  /** Consejo en lenguaje llano (para la tarjeta). */
  sugerencia: string;
  /** Texto de reemplazo redactado, listo para insertar en el documento. */
  nueva_redaccion: string;
}

export interface AnalisisDominio {
  score_general: number;
  resumen: string;
  findings: FindingDominio[];
}

export function mapearADominio(model: AnalisisModel): AnalisisDominio {
  return {
    score_general: model.overall_risk_score,
    resumen: model.summary,
    findings: model.findings.map((f) => ({
      excerpt: f.excerpt,
      categoria: f.category,
      nivel_riesgo: f.risk_level,
      score_riesgo: f.risk_score,
      problema: f.issue,
      sugerencia: f.suggestion,
      nueva_redaccion: f.redraft,
    })),
  };
}

/** Error explícito cuando la respuesta del modelo no es JSON válido o no calza el schema. */
export class AnalisisParseError extends Error {
  readonly raw: string;
  constructor(message: string, raw: string) {
    super(message);
    this.name = "AnalisisParseError";
    this.raw = raw;
  }
}

/**
 * El modelo respondió pero de forma inutilizable: bloqueado por filtros de
 * seguridad, respuesta vacía, o truncada por límite de tokens.
 */
export class AnalisisModeloError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnalisisModeloError";
  }
}

/**
 * Extrae el objeto JSON de la respuesta del modelo, tolerando ```json fences y
 * texto accidental antes/después. Lanza AnalisisParseError con un mensaje claro
 * si no se puede interpretar (para no dejar la pantalla en blanco).
 */
export function parseAnalisis(rawText: string): AnalisisDominio {
  const cleaned = rawText.replace(/```json|```/g, "").trim();

  // Aísla el primer objeto {...} balanceado, por si el modelo agregó prosa.
  const candidate = recortarPrimerObjeto(cleaned) ?? cleaned;

  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    throw new AnalisisParseError(
      "El modelo no devolvió un JSON que se pueda leer.",
      rawText,
    );
  }

  const result = analisisModelSchema.safeParse(parsed);
  if (!result.success) {
    throw new AnalisisParseError(
      `El JSON del modelo no tiene la forma esperada: ${result.error.issues
        .map((i) => `${i.path.join(".")} ${i.message}`)
        .join("; ")}`,
      rawText,
    );
  }

  return mapearADominio(result.data);
}

function recortarPrimerObjeto(s: string): string | null {
  const start = s.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null;
}
