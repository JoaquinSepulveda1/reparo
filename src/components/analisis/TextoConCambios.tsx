"use client";

import { buildSegments, textoDeReemplazo, type FindingLike } from "@/lib/contrato/matching";
import { colors } from "@/lib/design/tokens";
import { HoverTipText } from "./HoverTipText";

interface Props {
  /** Texto original del contrato. */
  original: string;
  /** Solo los hallazgos cuyo cambio se aplicó. */
  cambios: FindingLike[];
  className?: string;
}

/**
 * Documento con los cambios aplicados: el texto de reemplazo va en negrita y
 * azul tinta (hover = la sugerencia). Se re-deriva de `original` + `cambios`,
 * así que no depende de `texto_editado` guardado.
 */
export function TextoConCambios({ original, cambios, className = "" }: Props) {
  const segments = buildSegments(original, cambios);

  return (
    <div className={className}>
      {segments.map((seg, i) => {
        if (seg.type === "text") return <span key={i}>{seg.content}</span>;
        return (
          <HoverTipText
            key={i}
            tip={seg.f.sugerencia || "—"}
            className="cursor-help font-bold underline"
            style={{
              color: colors.ink.DEFAULT,
              textDecorationColor: colors.line,
              textDecorationThickness: "1.5px",
            }}
          >
            {textoDeReemplazo(seg.f)}
          </HoverTipText>
        );
      })}
    </div>
  );
}
