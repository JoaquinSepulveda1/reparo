"use client";

import { useMemo, useState } from "react";
import { buildSegments, textoDeReemplazo, type FindingLike } from "@/lib/contrato/matching";
import { paginar, segmentosPorPagina } from "@/lib/contrato/paginacion";
import { colors } from "@/lib/design/tokens";
import { HojaDoc } from "./HojaDoc";
import { HoverTipText } from "./HoverTipText";

interface Props {
  /** Texto original del contrato. */
  original: string;
  /** Hallazgos cuyo cambio se aplicó (todos se muestran como reemplazo). */
  cambios: FindingLike[];
  size?: "normal" | "compact";
  className?: string;
}

/**
 * Documento con control de cambios, paginado: lo reemplazado va tachado en rojo,
 * lo nuevo en negrita azul (hover = la sugerencia). Se re-deriva de
 * `original` + `cambios`. Se usa en el modal de guardar y en la biblioteca.
 */
export function DocumentoCambios({ original, cambios, size = "normal", className }: Props) {
  const [page, setPage] = useState(0);

  const segments = useMemo(() => buildSegments(original, cambios), [original, cambios]);
  const paginas = useMemo(() => paginar(original), [original]);
  const porPagina = useMemo(
    () => segmentosPorPagina(segments, paginas),
    [segments, paginas],
  );
  const actual = Math.min(page, porPagina.length - 1);

  return (
    <HojaDoc
      page={actual}
      total={porPagina.length}
      onPageChange={setPage}
      size={size}
      className={className}
    >
      {(porPagina[actual] ?? []).map((seg, i) => {
        if (seg.type === "text") return <span key={i}>{seg.content}</span>;
        return (
          <span key={i}>
            <del
              style={{
                color: colors.redline.DEFAULT,
                textDecorationThickness: "1.5px",
                opacity: 0.65,
              }}
            >
              {seg.content}
            </del>{" "}
            <HoverTipText
              tip={seg.f.sugerencia || "—"}
              className="cursor-help font-bold"
              style={{ color: colors.ink.DEFAULT }}
            >
              {textoDeReemplazo(seg.f)}
            </HoverTipText>
          </span>
        );
      })}
    </HojaDoc>
  );
}
