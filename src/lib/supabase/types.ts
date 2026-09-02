/**
 * Tipos del modelo de datos (2 tablas). Espejo del SQL en
 * supabase/migrations/0001_init.sql. Se usan para tipar las lecturas
 * (`.returns<T>()`); las escrituras se validan con zod en cada API route.
 */

export type NivelRiesgo = "alto" | "medio" | "bajo";

export interface ContratoRow {
  id: string;
  created_at: string;
  nombre_archivo: string | null;
  texto_original: string;
  texto_editado: string | null;
  score_general: number | null;
  resumen: string | null;
}

export interface FindingRow {
  id: string;
  contrato_id: string;
  excerpt: string;
  categoria: string | null;
  nivel_riesgo: NivelRiesgo | null;
  score_riesgo: number | null;
  problema: string | null;
  sugerencia: string | null;
  nueva_redaccion: string | null;
  aplicada: boolean;
}
