/**
 * Paginación del documento para la vista de resultado: en vez de un bloque largo
 * con scroll, el contrato se muestra como "hojas" navegables. Es solo
 * presentación — no afecta el análisis ni el texto que se guarda.
 */

import type { Segment, FindingLike } from "./matching";
import { puntosDeCorte } from "./chunking";
import { PAGE_CHARS } from "./constantes";

export interface Pagina {
  /** Offset (en caracteres) donde empieza la página dentro del texto completo. */
  start: number;
  end: number;
}

/** Divide el texto en rangos de página de ~`objetivo` caracteres. */
export function paginar(texto: string, objetivo = PAGE_CHARS): Pagina[] {
  if (!texto) return [{ start: 0, end: 0 }];
  const cortes = puntosDeCorte(texto, objetivo);
  const bordes = [0, ...cortes, texto.length];
  const paginas: Pagina[] = [];
  for (let i = 0; i < bordes.length - 1; i++) {
    paginas.push({ start: bordes[i], end: bordes[i + 1] });
  }
  return paginas;
}

/**
 * Reparte una lista de segmentos (ya resuelta sobre el texto completo, con sus
 * solapamientos descartados) en una lista por página. Un segmento de texto que
 * cruza el borde se parte; un highlight que cruza se deja entero en la página
 * donde empieza (los excerpts son cortos, casi nunca pasa).
 *
 * Asume que los segmentos, concatenados, reproducen el texto completo en orden
 * — que es justo lo que devuelve `buildSegments`.
 */
export function segmentosPorPagina<F extends FindingLike>(
  segments: Segment<F>[],
  paginas: Pagina[],
): Segment<F>[][] {
  const porPagina: Segment<F>[][] = paginas.map(() => []);
  let cursor = 0;
  let pag = 0;

  for (const seg of segments) {
    const finSeg = cursor + seg.content.length;

    if (seg.type === "hl") {
      while (pag < paginas.length - 1 && cursor >= paginas[pag].end) pag++;
      porPagina[pag].push(seg);
      cursor = finSeg;
      continue;
    }

    // Segmento de texto: puede abarcar varias páginas.
    let desde = cursor;
    while (desde < finSeg) {
      while (pag < paginas.length - 1 && desde >= paginas[pag].end) pag++;
      const hasta = Math.min(finSeg, paginas[pag].end);
      const trozo = seg.content.slice(desde - cursor, hasta - cursor);
      if (trozo) porPagina[pag].push({ type: "text", content: trozo });
      desde = hasta;
      if (hasta >= paginas[pag].end && pag < paginas.length - 1) pag++;
    }
    cursor = finSeg;
  }

  return porPagina;
}

/** Mapa índice-de-finding → primera página donde aparece su highlight. */
export function paginaPorFinding<F extends FindingLike>(
  porPagina: Segment<F>[][],
): Record<number, number> {
  const mapa: Record<number, number> = {};
  porPagina.forEach((segs, p) => {
    for (const s of segs) {
      if (s.type === "hl" && !(s.idx in mapa)) mapa[s.idx] = p;
    }
  });
  return mapa;
}
