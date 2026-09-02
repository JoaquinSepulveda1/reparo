import { DISCLAIMER } from "@/lib/contrato/constantes";

/** Aviso legal visible. Requerido en toda pantalla con resultados. */
export function Disclaimer({ className = "" }: { className?: string }) {
  return (
    <p className={`font-mono text-[11px] leading-relaxed text-ink-3 ${className}`}>
      {DISCLAIMER}
    </p>
  );
}
