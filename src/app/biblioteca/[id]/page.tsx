import { notFound } from "next/navigation";
import { Header } from "@/components/app/Header";
import { RevisionWorkspace } from "@/components/revision/RevisionWorkspace";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { EstadoContrato, Finding, NivelRiesgo } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface FindingRow {
  id: string;
  excerpt: string;
  categoria: string | null;
  nivel_riesgo: NivelRiesgo | null;
  score_riesgo: number | null;
  problema: string | null;
  sugerencia: string | null;
  nueva_redaccion: string | null;
  aplicada: boolean;
}

interface Row {
  id: string;
  nombre_archivo: string | null;
  texto_original: string;
  score_general: number | null;
  resumen: string | null;
  estado: EstadoContrato;
  aprobado_por: string | null;
  findings: FindingRow[];
}

export default async function ContratoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("contratos")
    .select(
      "id, nombre_archivo, texto_original, score_general, resumen, estado, aprobado_por, findings(id, excerpt, categoria, nivel_riesgo, score_riesgo, problema, sugerencia, nueva_redaccion, aplicada)",
    )
    .eq("id", id)
    .maybeSingle<Row>();

  if (error || !data) notFound();

  const findings: Finding[] = data.findings.map((f) => ({
    excerpt: f.excerpt,
    categoria: f.categoria ?? "",
    nivel_riesgo: f.nivel_riesgo ?? "medio",
    score_riesgo: f.score_riesgo ?? 0,
    problema: f.problema ?? "",
    sugerencia: f.sugerencia ?? "",
    nueva_redaccion: f.nueva_redaccion ?? "",
  }));
  const aplicadasIniciales: Record<number, boolean> = {};
  data.findings.forEach((f, i) => {
    if (f.aplicada) aplicadasIniciales[i] = true;
  });

  return (
    <main>
      <Header />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 font-serif text-[24px] font-medium">
          {data.nombre_archivo || "Contrato pegado"}
        </h1>
        <RevisionWorkspace
          modo="guardado"
          contractText={data.texto_original}
          scoreGeneral={data.score_general ?? 0}
          resumen={data.resumen ?? ""}
          findings={findings}
          nombre={data.nombre_archivo || "Contrato pegado"}
          contratoId={data.id}
          aplicadasIniciales={aplicadasIniciales}
          estado={data.estado}
          aprobadoPor={data.aprobado_por}
        />
      </div>
    </main>
  );
}
