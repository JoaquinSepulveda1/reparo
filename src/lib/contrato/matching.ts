/**
 * Matching de excerpts del modelo contra el texto real del contrato.
 * Portado tal cual desde ContratoReview.jsx (normalizeChars / findExcerptRange /
 * buildSegments), sin depender de React. Sirve para renderizar el documento con
 * highlights y para derivar el "texto con cambios".
 */

export interface FindingLike {
  excerpt: string;
  sugerencia: string;
  /** Texto de reemplazo redactado. Si falta, se usa `sugerencia`. */
  nueva_redaccion?: string | null;
  nivel_riesgo?: "alto" | "medio" | "bajo" | null;
}

/** Texto que reemplaza al excerpt cuando se aplica el cambio. */
export function textoDeReemplazo(f: FindingLike): string {
  return f.nueva_redaccion?.trim() || f.sugerencia;
}

export type Segment<F extends FindingLike = FindingLike> =
  | { type: "text"; content: string }
  | { type: "hl"; content: string; f: F; idx: number };

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Normaliza comillas "curvas", guiones largos y espacios de ancho fijo a su
 * equivalente simple. Length-preserving a propósito: así los índices siguen
 * calzando entre el texto normalizado y el original.
 */
export function normalizeChars(s: string): string {
  return s
    .replace(/[‘’ʼ′]/g, "'")
    .replace(/[“”″]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/ /g, " ");
}

/**
 * Busca el excerpt en el texto tolerando diferencias de comillas, guiones y
 * espacios/saltos de línea entre lo que citó el modelo y el documento original.
 */
export function findExcerptRange(
  text: string,
  excerpt: string,
): { start: number; end: number } | null {
  if (!excerpt) return null;
  const normText = normalizeChars(text);
  const normExcerpt = normalizeChars(excerpt);

  const exact = normText.indexOf(normExcerpt);
  if (exact !== -1) return { start: exact, end: exact + excerpt.length };

  const words = normExcerpt.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;
  const pattern = words.map(escapeRegex).join("\\s+");
  try {
    const match = new RegExp(pattern).exec(normText);
    if (match) return { start: match.index, end: match.index + match[0].length };
  } catch {
    /* patrón inválido, sin match */
  }
  return null;
}

/**
 * Parte el texto en segmentos alternando texto plano y tramos resaltados.
 * Descarta solapamientos: si dos findings apuntan a rangos que se pisan, gana
 * el que empieza antes.
 */
export function buildSegments<F extends FindingLike>(
  text: string,
  findings: F[],
): Segment<F>[] {
  const matches: { start: number; end: number; f: F; idx: number }[] = [];
  findings.forEach((f, idx) => {
    const range = findExcerptRange(text, f.excerpt);
    if (range) matches.push({ start: range.start, end: range.end, f, idx });
  });
  matches.sort((a, b) => a.start - b.start);

  const clean: typeof matches = [];
  let lastEnd = -1;
  matches.forEach((m) => {
    if (m.start >= lastEnd) {
      clean.push(m);
      lastEnd = m.end;
    }
  });

  const segments: Segment<F>[] = [];
  let cursor = 0;
  clean.forEach((m) => {
    if (m.start > cursor) segments.push({ type: "text", content: text.slice(cursor, m.start) });
    segments.push({ type: "hl", content: text.slice(m.start, m.end), f: m.f, idx: m.idx });
    cursor = m.end;
  });
  if (cursor < text.length) segments.push({ type: "text", content: text.slice(cursor) });
  return segments;
}

/** Índices de findings que sí se pudieron ubicar en el documento. */
export function matchedIndices(segments: Segment[]): Set<number> {
  return new Set(
    segments.flatMap((s) => (s.type === "hl" ? [s.idx] : [])),
  );
}

/**
 * Reconstruye el texto aplicando las sugerencias marcadas en `applied`
 * (índice de finding → boolean). Igual que `editedText` del prototipo.
 */
export function buildEditedText(
  segments: Segment[],
  applied: Record<number, boolean>,
): string {
  return segments
    .map((seg) =>
      seg.type === "hl" && applied[seg.idx] ? textoDeReemplazo(seg.f) : seg.content,
    )
    .join("");
}
