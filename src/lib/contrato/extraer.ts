/**
 * Extracción de texto de archivos, en el CLIENTE (igual que el prototipo).
 * El servidor solo recibe el texto ya extraído.
 */

export class ExtraccionError extends Error {}

export async function extraerTexto(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".txt")) {
    return file.text();
  }

  if (name.endsWith(".docx")) {
    // Build de navegador de mammoth.
    const mammoth = await import("mammoth/mammoth.browser");
    const arrayBuffer = await file.arrayBuffer();
    const res = await mammoth.extractRawText({ arrayBuffer });
    return res.value;
  }

  if (name.endsWith(".pdf")) {
    return extraerPdf(file);
  }

  throw new ExtraccionError("Formato no soportado. Usá .txt, .docx o .pdf.");
}

async function extraerPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // El worker se sirve desde unpkg, fijado a la versión instalada.
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const data = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text +=
      content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ") + "\n";
  }
  return text;
}
