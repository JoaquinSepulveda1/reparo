/**
 * Tipos y helpers de fetch para el frontend. Todo pasa por los API routes
 * del servidor (nunca se llama a Gemini ni a Supabase desde el cliente).
 */

export type NivelRiesgo = "alto" | "medio" | "bajo";

/** Un hallazgo tal como lo devuelve /api/analizar (sin `aplicada` ni `id`). */
export interface Finding {
  excerpt: string;
  categoria: string;
  nivel_riesgo: NivelRiesgo;
  score_riesgo: number;
  problema: string;
  /** Consejo en lenguaje llano (tarjeta). */
  sugerencia: string;
  /** Texto de reemplazo redactado, para el documento "Con cambios". */
  nueva_redaccion: string;
}

export interface AnalizarResponse {
  score_general: number;
  resumen: string;
  findings: Finding[];
  uso_precedentes: boolean;
  meta: { truncado: boolean; chars_analizados: number; nombre_archivo: string | null };
}

export interface FindingGuardado extends Finding {
  id: string;
  aplicada: boolean;
}

export interface ContratoGuardado {
  id: string;
  created_at: string;
  nombre_archivo: string | null;
  texto_original: string;
  texto_editado: string | null;
  score_general: number | null;
  resumen: string | null;
  findings: FindingGuardado[];
}

export class ApiError extends Error {
  readonly status: number;
  readonly detalle?: string;
  constructor(message: string, status: number, detalle?: string) {
    super(message);
    this.status = status;
    this.detalle = detalle;
  }
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      data?.error || "Ocurrió un error. Intentá de nuevo.",
      res.status,
      data?.detalle,
    );
  }
  return data as T;
}

export function analizar(texto: string, nombreArchivo?: string) {
  return post<AnalizarResponse>("/api/analizar", { texto, nombreArchivo });
}

export interface GuardarPayload {
  nombre_archivo: string | null;
  texto_original: string;
  texto_editado: string | null;
  score_general: number | null;
  resumen: string | null;
  findings: Array<Finding & { aplicada: boolean }>;
}

export function guardarContrato(payload: GuardarPayload) {
  return post<{ id: string }>("/api/contratos", payload);
}

export async function listarContratos(): Promise<ContratoGuardado[]> {
  const res = await fetch("/api/contratos");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data?.error || "No se pudo cargar la biblioteca.", res.status);
  return (data.contratos ?? []) as ContratoGuardado[];
}

export async function eliminarContrato(id: string): Promise<void> {
  const res = await fetch(`/api/contratos/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data?.error || "No se pudo eliminar el análisis.", res.status);
  }
}

export async function logout() {
  await fetch("/api/logout", { method: "POST" });
}
