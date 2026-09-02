"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { ScoreRing } from "@/components/analisis/ScoreRing";
import { DocumentoTexto } from "@/components/analisis/DocumentoTexto";
import { DocumentoCambios } from "@/components/analisis/DocumentoCambios";
import { Disclaimer } from "@/components/app/Disclaimer";
import { listarContratos, eliminarContrato, ApiError, type ContratoGuardado } from "@/lib/api";

export function BibliotecaView() {
  const [contratos, setContratos] = useState<ContratoGuardado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    listarContratos()
      .then(setContratos)
      .catch((e) => setError(e instanceof ApiError ? e.message : "No se pudo cargar la biblioteca."))
      .finally(() => setLoading(false));
  }, []);

  async function onEliminar(id: string) {
    if (!window.confirm("¿Eliminar este análisis de la biblioteca? No se puede deshacer.")) return;
    setDeletingId(id);
    setError("");
    try {
      await eliminarContrato(id);
      setContratos((prev) => prev.filter((c) => c.id !== id));
      if (openId === id) setOpenId(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo eliminar el análisis.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <p className="eyebrow mb-2.5">Biblioteca de precedentes</p>
      <h1 className="mb-2.5 font-serif text-[28px] font-medium">Contratos revisados</h1>
      <p className="mb-7 max-w-[60ch] text-[14.5px] text-ink-2">
        Cada análisis guardado acá se usa como referencia en las próximas revisiones: el criterio que
        aceptaste una vez, se aplica de nuevo.
      </p>

      {loading && (
        <p className="flex items-center gap-2 font-mono text-[12px] text-ink-3">
          <Loader2 size={13} className="animate-spin" /> cargando…
        </p>
      )}

      {error && <p className="text-[13px] text-redline">{error}</p>}

      {!loading && !error && contratos.length === 0 && (
        <div className="border border-dashed border-line p-6 text-center text-[14px] text-ink-3">
          Todavía no guardaste ningún análisis. Analizá un contrato y usá &quot;Guardar en
          biblioteca&quot;.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {contratos.map((c) => {
          const open = openId === c.id;
          const aplicadas = c.findings.filter((f) => f.aplicada).length;
          return (
            <div key={c.id} className="border border-line bg-paper-raised">
              <div className="flex items-center gap-3 px-[18px] py-[14px]">
                <button
                  onClick={() => setOpenId(open ? null : c.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="block truncate text-[14px] font-medium text-ink">
                    {c.nombre_archivo || "Contrato pegado"}
                  </span>
                  <span className="mt-0.5 block font-mono text-[10.5px] text-ink-3">
                    {new Date(c.created_at).toLocaleDateString("es-CL", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                    {" · "}
                    {aplicadas} de {c.findings.length} cambios aplicados
                  </span>
                </button>
                {c.score_general != null && <ScoreRing score={c.score_general} size={34} />}
                <button
                  onClick={() => onEliminar(c.id)}
                  disabled={deletingId === c.id}
                  aria-label="Eliminar análisis"
                  className="p-1 text-ink-3 transition-colors hover:text-redline disabled:opacity-40"
                >
                  {deletingId === c.id ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Trash2 size={15} />
                  )}
                </button>
              </div>

              {open && (
                <div className="grid gap-6 border-t border-line p-[18px] lg:grid-cols-2">
                  <div>
                    <p className="mb-1.5 font-mono text-[10px] uppercase text-ink-3">Original</p>
                    <DocumentoTexto texto={c.texto_original} size="compact" />
                  </div>
                  <div>
                    <p
                      className="mb-1.5 font-mono text-[10px] uppercase"
                      style={{ color: "#8C6B2F" }}
                    >
                      Con cambios aplicados
                    </p>
                    <DocumentoCambios
                      original={c.texto_original}
                      size="compact"
                      cambios={c.findings
                        .filter((f) => f.aplicada)
                        .map((f) => ({
                          excerpt: f.excerpt,
                          sugerencia: f.sugerencia ?? "",
                          nueva_redaccion: f.nueva_redaccion,
                          nivel_riesgo: f.nivel_riesgo,
                        }))}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Disclaimer className="mt-10" />
    </div>
  );
}
