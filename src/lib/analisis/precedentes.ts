import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Mecanismo de "aprendizaje" sin reentrenar el modelo.
 *
 * Antes de cada análisis, junta los últimos 3 contratos guardados y arma un
 * resumen compacto de qué sugerencias fueron aceptadas (aplicada = true). Ese
 * texto se inyecta en el system prompt como "precedentes": cada análisis nuevo
 * se informa con el criterio que el usuario ya validó.
 *
 * Portado de getPrecedentsDigest() del prototipo, cambiando window.storage por
 * una consulta a Postgres.
 */
interface ContratoConFindings {
  id: string;
  created_at: string;
  findings: Array<{
    categoria: string | null;
    excerpt: string | null;
    sugerencia: string | null;
    aplicada: boolean;
  }>;
}

export async function getPrecedentsDigest(
  supabase: SupabaseClient,
): Promise<string> {
  const { data, error } = await supabase
    .from("contratos")
    .select("id, created_at, findings(categoria, excerpt, sugerencia, aplicada)")
    .order("created_at", { ascending: false })
    .limit(3)
    .returns<ContratoConFindings[]>();

  if (error || !data || data.length === 0) return "";

  const lines = data
    .flatMap((c) => (c.findings ?? []).filter((f) => f.aplicada))
    .slice(0, 8)
    .map(
      (f) =>
        `- (${f.categoria ?? "Otro"}) se aceptó cambiar "${(f.excerpt ?? "").slice(
          0,
          60,
        )}" por "${(f.sugerencia ?? "").slice(0, 60)}"`,
    );

  if (lines.length === 0) return "";

  return `Precedentes de revisiones anteriores de este usuario (úsalos como referencia de su criterio real; no los repitas literalmente si no aplican al contrato actual):\n${lines.join(
    "\n",
  )}`;
}
