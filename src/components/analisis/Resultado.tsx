"use client";

import { RevisionWorkspace } from "@/components/revision/RevisionWorkspace";
import { Disclaimer } from "@/components/app/Disclaimer";
import type { AnalizarResponse } from "@/lib/api";

interface Props {
  resultado: AnalizarResponse;
  contractText: string;
  fileName: string;
  onReset: () => void;
}

/**
 * Resultado de un análisis recién hecho. El grueso vive en RevisionWorkspace
 * (documento + panel + comentarios + guardar); acá solo se arma el contexto.
 */
export function Resultado({ resultado, contractText, fileName, onReset }: Props) {
  return (
    <div>
      <RevisionWorkspace
        modo="analisis"
        contractText={contractText}
        scoreGeneral={resultado.score_general}
        resumen={resultado.resumen}
        findings={resultado.findings}
        usoPrecedentes={resultado.uso_precedentes}
        meta={resultado.meta}
        nombre={fileName}
        contratoId={null}
        onReset={onReset}
      />
      <Disclaimer className="mt-10" />
    </div>
  );
}
