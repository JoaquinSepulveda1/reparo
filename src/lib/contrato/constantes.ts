/**
 * Límites de tamaño del contrato.
 *
 * El análisis se hace por trozos ("chunks"): cada trozo va en una llamada
 * independiente a Gemini y después se fusionan los resultados. Trocear mejora la
 * cobertura (pedir "hasta 6 hallazgos" sobre 8 páginas hace que el modelo lea
 * por encima) y permite contratos más largos que el viejo tope de 6000.
 */

/** Caracteres por trozo de análisis (una llamada a Gemini). */
export const CHUNK_CHARS = 9000;

/** Máximo de trozos por contrato. Acota la latencia y el gasto de cuota. */
export const MAX_CHUNKS = 4;

/** Tope duro de caracteres analizados. Lo que exceda se trunca (con aviso). */
export const MAX_CHARS_TOTAL = CHUNK_CHARS * MAX_CHUNKS;

/** Caracteres por página en la vista paginada del documento (solo UI). */
export const PAGE_CHARS = 1800;

export const DISCLAIMER =
  "Esto es apoyo para la revisión, no reemplaza el criterio de un abogado.";
