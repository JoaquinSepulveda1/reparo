/**
 * Troceo de contratos para el análisis y para la vista paginada.
 *
 * Todo acá es función pura sobre strings: ni React ni Gemini ni fetch.
 * `puntosDeCorte` es el primitivo compartido; `dividirEnChunks` lo usa para el
 * pipeline de análisis y `paginacion.ts` para la UI.
 */

/**
 * Calcula los índices donde cortar `texto` en bloques de ~`objetivo` caracteres,
 * pero moviendo cada corte al límite "natural" más cercano hacia adelante
 * (primero un salto de párrafo `\n\n`, luego un salto de línea, luego un fin de
 * oración `. `), dentro de una ventana. Si no hay ninguno, corta en seco.
 *
 * Devuelve los offsets internos (sin 0 ni `texto.length`). Con `max` limita la
 * cantidad de bloques: el último se extiende hasta donde alcance.
 */
export function puntosDeCorte(
  texto: string,
  objetivo: number,
  max = Infinity,
): number[] {
  const cortes: number[] = [];
  const ventana = Math.max(200, Math.floor(objetivo * 0.4));
  let inicio = 0;

  while (texto.length - inicio > objetivo + ventana) {
    if (cortes.length + 1 >= max) break;

    const ideal = inicio + objetivo;
    const finVentana = Math.min(texto.length, ideal + ventana);
    const tramo = texto.slice(ideal, finVentana);

    let rel = tramo.indexOf("\n\n");
    let largoSep = 2;
    if (rel === -1) {
      rel = tramo.indexOf("\n");
      largoSep = 1;
    }
    if (rel === -1) {
      rel = tramo.indexOf(". ");
      largoSep = 2;
    }

    const corte = rel === -1 ? ideal : ideal + rel + largoSep;
    cortes.push(corte);
    inicio = corte;
  }

  return cortes;
}

/**
 * Parte `texto` en trozos para el análisis. Cada trozo ≤ ~`chunkChars` (+ventana)
 * y como mucho hay `maxChunks`: lo que exceda queda fuera (el llamador avisa que
 * se truncó). Un contrato corto devuelve `[texto]` y el pipeline se comporta
 * igual que antes de existir el troceo.
 */
export function dividirEnChunks(
  texto: string,
  { chunkChars, maxChunks }: { chunkChars: number; maxChunks: number },
): string[] {
  const limpio = texto.trim();
  if (!limpio) return [];
  if (limpio.length <= chunkChars) return [limpio];

  const cortes = puntosDeCorte(limpio, chunkChars, maxChunks);
  const bordes = [0, ...cortes, limpio.length];

  const chunks: string[] = [];
  for (let i = 0; i < bordes.length - 1 && chunks.length < maxChunks; i++) {
    // El último trozo permitido se corta en el tope, no en el borde natural.
    const fin =
      chunks.length === maxChunks - 1
        ? Math.min(limpio.length, bordes[i] + chunkChars)
        : bordes[i + 1];
    const trozo = limpio.slice(bordes[i], fin).trim();
    if (trozo) chunks.push(trozo);
    if (fin >= limpio.length) break;
  }
  return chunks;
}
