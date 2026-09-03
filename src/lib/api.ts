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
  meta: {
    truncado: boolean;
    chars_analizados: number;
    chunks: number;
    nombre_archivo: string | null;
  };
}

export interface FindingGuardado extends Finding {
  id: string;
  aplicada: boolean;
}

export type EstadoContrato = "borrador" | "aprobado";

export interface ContratoGuardado {
  id: string;
  created_at: string;
  nombre_archivo: string | null;
  texto_original: string;
  texto_editado: string | null;
  score_general: number | null;
  resumen: string | null;
  estado: EstadoContrato;
  creado_por: string | null;
  aprobado_por: string | null;
  aprobado_en: string | null;
  actualizado_en: string | null;
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

export interface ContratoPatch {
  nombre_archivo?: string;
  texto_editado?: string | null;
  estado?: EstadoContrato;
  findings_aplicada?: Array<{ excerpt: string; aplicada: boolean }>;
}

export async function actualizarContrato(id: string, patch: ContratoPatch): Promise<void> {
  const res = await fetch(`/api/contratos/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data?.error || "No se pudo actualizar el análisis.", res.status);
  }
}

export function renombrarContrato(id: string, nombre: string) {
  return actualizarContrato(id, { nombre_archivo: nombre });
}

export function aprobarContrato(id: string) {
  return actualizarContrato(id, { estado: "aprobado" });
}

export function reabrirContrato(id: string) {
  return actualizarContrato(id, { estado: "borrador" });
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

// --------------------------------------------------------------------------
// Comentarios
// --------------------------------------------------------------------------

export interface Comentario {
  id: string;
  contrato_id: string;
  parent_id: string | null;
  autor_email: string;
  autor_nombre: string | null;
  cuerpo: string;
  rango_inicio: number | null;
  rango_fin: number | null;
  excerpt: string | null;
  resuelto: boolean;
  resuelto_por: string | null;
  created_at: string;
}

export interface NuevoComentario {
  cuerpo: string;
  parent_id?: string | null;
  rango_inicio?: number | null;
  rango_fin?: number | null;
  excerpt?: string | null;
}

export async function listarComentarios(
  contratoId: string,
): Promise<{ comentarios: Comentario[]; yo: string }> {
  const res = await fetch(`/api/contratos/${contratoId}/comentarios`, { cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data?.error || "No se pudieron cargar los comentarios.", res.status);
  }
  return { comentarios: (data.comentarios ?? []) as Comentario[], yo: data.yo as string };
}

export async function crearComentario(
  contratoId: string,
  body: NuevoComentario,
): Promise<Comentario> {
  const res = await fetch(`/api/contratos/${contratoId}/comentarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data?.error || "No se pudo guardar el comentario.", res.status);
  return data.comentario as Comentario;
}

export async function resolverComentario(
  contratoId: string,
  comentarioId: string,
  resuelto: boolean,
): Promise<void> {
  const res = await fetch(`/api/contratos/${contratoId}/comentarios/${comentarioId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resuelto }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data?.error || "No se pudo actualizar el comentario.", res.status);
  }
}

export async function borrarComentario(contratoId: string, comentarioId: string): Promise<void> {
  const res = await fetch(`/api/contratos/${contratoId}/comentarios/${comentarioId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data?.error || "No se pudo borrar el comentario.", res.status);
  }
}
