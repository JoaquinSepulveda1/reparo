"use client";

import { useMemo, useState } from "react";
import { paginar } from "@/lib/contrato/paginacion";
import { HojaDoc } from "./HojaDoc";

interface Props {
  texto: string;
  size?: "normal" | "compact";
  className?: string;
}

/**
 * Documento de solo lectura, paginado, sin highlights. Se usa para la vista
 * previa al subir/pegar y para el "Original" en la biblioteca.
 */
export function DocumentoTexto({ texto, size = "normal", className }: Props) {
  const [page, setPage] = useState(0);
  const paginas = useMemo(() => paginar(texto), [texto]);
  const actual = Math.min(page, paginas.length - 1);
  const pag = paginas[actual] ?? { start: 0, end: texto.length };
  const miniaturas = useMemo(
    () => paginas.map((p) => texto.slice(p.start, p.end)),
    [paginas, texto],
  );

  return (
    <HojaDoc
      page={actual}
      total={paginas.length}
      onPageChange={setPage}
      miniaturas={miniaturas}
      size={size}
      className={className}
    >
      {texto.slice(pag.start, pag.end)}
    </HojaDoc>
  );
}
