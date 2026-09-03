/**
 * Traduce la selección de texto del usuario dentro de la "hoja" del documento a
 * offsets de caracteres sobre `texto_original`.
 *
 * `container` tiene que ser el elemento cuyo `textContent` concatenado es
 * exactamente el texto de la página visible (en Reparo: el div interno de
 * `HojaDoc`, sin el marcador "— N —"). `pageStartOffset` es el offset absoluto
 * donde empieza esa página en `texto_original` (lo da `paginar()`).
 */
export interface RangoSeleccion {
  inicio: number;
  fin: number;
  texto: string;
}

export function rangoDesdeSeleccion(
  container: HTMLElement,
  pageStartOffset: number,
): RangoSeleccion | null {
  const sel = typeof window !== "undefined" ? window.getSelection() : null;
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;

  const range = sel.getRangeAt(0);
  if (!container.contains(range.startContainer) || !container.contains(range.endContainer)) {
    return null;
  }

  const texto = range.toString();
  if (!texto.trim()) return null;

  // Longitud del texto entre el inicio del container y el inicio de la selección.
  const pre = document.createRange();
  pre.selectNodeContents(container);
  try {
    pre.setEnd(range.startContainer, range.startOffset);
  } catch {
    return null;
  }
  const inicioEnPagina = pre.toString().length;

  return {
    inicio: pageStartOffset + inicioEnPagina,
    fin: pageStartOffset + inicioEnPagina + texto.length,
    texto,
  };
}

/** Limpia la selección actual del navegador. */
export function limpiarSeleccion() {
  window.getSelection()?.removeAllRanges();
}
