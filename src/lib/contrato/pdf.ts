/**
 * Exporta un contrato (texto plano) a PDF, del lado del cliente. `jspdf` se
 * carga dinámicamente para no pesar en el bundle principal.
 */

const INK: [number, number, number] = [27, 42, 74];

function nombreArchivo(nombre: string, variante: string): string {
  const base =
    nombre
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "") // saca tildes
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase()
      .slice(0, 60) || "contrato";
  return `${base}-${variante}.pdf`;
}

export async function descargarContratoPdf({
  nombre,
  titulo,
  texto,
  variante,
}: {
  /** Nombre visible del análisis (va como título del documento). */
  nombre: string;
  /** Subtítulo: "Original", "Con cambios aplicados". */
  titulo: string;
  texto: string;
  /** Sufijo del archivo: "original" | "con-cambios". */
  variante: string;
}): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 56;
  const maxW = pageW - margin * 2;

  // Encabezado
  doc.setTextColor(...INK);
  doc.setFont("times", "bold");
  doc.setFontSize(15);
  const tituloLines = doc.splitTextToSize(nombre || "Contrato", maxW);
  doc.text(tituloLines, margin, margin);
  let y = margin + tituloLines.length * 18 + 4;

  doc.setFont("times", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(titulo.toUpperCase(), margin, y);
  y += 8;
  doc.setDrawColor(210, 205, 195);
  doc.line(margin, y, pageW - margin, y);
  y += 22;

  // Cuerpo
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  const lineH = 15.5;
  const lines = doc.splitTextToSize(texto.replace(/\r\n/g, "\n"), maxW);
  for (const line of lines) {
    if (y > pageH - margin - 24) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += lineH;
  }

  // Pie: número de página
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont("times", "normal");
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`${i} / ${total}`, pageW / 2, pageH - 28, { align: "center" });
  }

  doc.save(nombreArchivo(nombre, variante));
}
