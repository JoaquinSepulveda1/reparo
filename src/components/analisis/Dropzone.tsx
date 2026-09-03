"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { FileText, UploadCloud, X, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AmbientBackground } from "@/components/brand/AmbientBackground";
import { cn } from "@/components/ui/cn";
import { CHUNK_CHARS, MAX_CHARS_TOTAL, MAX_CHUNKS } from "@/lib/contrato/constantes";
import { extraerTexto, ExtraccionError } from "@/lib/contrato/extraer";
import { DocumentoTexto } from "./DocumentoTexto";

interface Props {
  texto: string;
  fileName: string;
  onChange: (texto: string, fileName: string) => void;
  onAnalizar: () => void;
  error: string;
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function Dropzone({ texto, fileName, onChange, onAnalizar, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [leyendo, setLeyendo] = useState(false);
  const [errorLocal, setErrorLocal] = useState("");
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [vista, setVista] = useState<"editar" | "leer">("editar");

  const pct = Math.min(100, (texto.length / MAX_CHARS_TOTAL) * 100);
  const meterColor =
    texto.length >= MAX_CHARS_TOTAL
      ? "var(--redline)"
      : texto.length > CHUNK_CHARS * 2
        ? "var(--brass)"
        : "var(--accent)";

  async function handleFile(file?: File | null) {
    if (!file) return;
    setLeyendo(true);
    setErrorLocal("");
    try {
      const raw = await extraerTexto(file);
      if (!raw.trim()) {
        setErrorLocal(
          "No encontré texto en ese archivo (¿es un PDF escaneado como imagen?). Probá pegando el texto.",
        );
        return;
      }
      onChange(raw.slice(0, MAX_CHARS_TOTAL), file.name);
      setFileSize(file.size);
      setVista("leer");
    } catch (e) {
      setErrorLocal(
        e instanceof ExtraccionError
          ? e.message
          : "No pude leer ese archivo. Probá pegando el texto directamente.",
      );
    } finally {
      setLeyendo(false);
    }
  }

  function clearFile() {
    onChange("", "");
    setFileSize(null);
    setVista("editar");
  }

  return (
    <div className="relative">
      <AmbientBackground />

      <p className="eyebrow mb-2.5">Paso 1 — Subí o pegá tu contrato</p>
      <h1 className="mb-3 max-w-[18ch] font-serif text-[32px] font-medium leading-[1.12] sm:text-[38px]">
        Subí un contrato y te decimos qué revisar primero
      </h1>
      <p className="mb-8 max-w-[54ch] text-[15px] leading-relaxed text-ink-2">
        Detectamos las cláusulas riesgosas o atípicas y les asignamos un puntaje, con el marco
        legal chileno como referencia.
      </p>

      {fileName ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center gap-3 rounded-lg border border-line bg-paper-raised px-4 py-3 shadow-sm"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded bg-accent-soft text-accent">
            <FileText size={16} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px] font-medium text-ink">{fileName}</span>
            <span className="font-mono text-[10.5px] uppercase tracking-eyebrow text-ink-3">
              {fileSize != null ? `${formatBytes(fileSize)} · ` : ""}
              {texto.length.toLocaleString("es-CL")} caracteres
            </span>
          </span>
          <button
            onClick={clearFile}
            aria-label="Quitar archivo"
            className="grid h-7 w-7 place-items-center rounded text-ink-3 transition-colors hover:bg-paper-2 hover:text-redline"
          >
            <X size={14} />
          </button>
        </motion.div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragEnter={(e) => {
            e.preventDefault();
            dragDepth.current += 1;
            setDragging(true);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={(e) => {
            e.preventDefault();
            dragDepth.current -= 1;
            if (dragDepth.current <= 0) setDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            dragDepth.current = 0;
            setDragging(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "mb-4 flex cursor-pointer flex-col items-center justify-center gap-2.5 rounded-lg border border-dashed px-6 py-10 text-center transition-all duration-200 ease-out-expo",
            dragging
              ? "scale-[1.01] border-accent bg-accent-soft"
              : "border-line-strong bg-paper-raised hover:border-ink-3 hover:bg-paper-2",
          )}
        >
          <span
            className={cn(
              "grid h-11 w-11 place-items-center rounded-full transition-colors",
              dragging ? "bg-accent text-paper" : "bg-paper-2 text-ink-3",
            )}
          >
            {leyendo ? <Loader2 size={19} className="animate-spin" /> : <UploadCloud size={19} />}
          </span>
          <span className="text-[14px] text-ink-2">
            {leyendo
              ? "Leyendo el archivo…"
              : dragging
                ? "Soltá el archivo acá"
                : "Arrastrá un .docx, .pdf o .txt, o hacé clic para elegir"}
          </span>
          <input
            ref={inputRef}
            type="file"
            accept=".txt,.docx,.pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      )}

      <div className="mb-2 flex items-center justify-between">
        <p className="font-mono text-[10.5px] uppercase tracking-eyebrow text-ink-3">
          — o pegá el texto directamente —
        </p>
        {texto.trim() && (
          <div className="relative flex rounded border border-line p-0.5">
            {(["editar", "leer"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVista(v)}
                className={cn(
                  "relative z-10 rounded-sm px-3 py-1 font-mono text-[10px] uppercase tracking-[0.04em] transition-colors",
                  vista === v ? "text-paper" : "text-ink-3 hover:text-ink",
                )}
              >
                {vista === v && (
                  <motion.span
                    layoutId="dropzone-vista"
                    className="absolute inset-0 -z-0 rounded-sm bg-ink"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">{v === "editar" ? "Texto" : "Vista previa"}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {vista === "leer" && texto.trim() ? (
        <DocumentoTexto texto={texto} />
      ) : (
        <textarea
          value={texto}
          onChange={(e) => {
            onChange(e.target.value.slice(0, MAX_CHARS_TOTAL), "");
            setFileSize(null);
          }}
          placeholder="Pegá aquí el texto del contrato…"
          rows={10}
          className="w-full resize-y rounded-lg border border-line bg-paper-raised p-4 font-serif text-[14.5px] leading-relaxed text-ink outline-none transition-colors focus:border-ink-3"
        />
      )}

      {/* Rail de caracteres */}
      <div className="mb-6 mt-3">
        <div className="h-1 w-full overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full transition-all duration-300 ease-out-expo"
            style={{ width: `${pct}%`, background: meterColor }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between font-mono text-[10.5px] text-ink-3">
          <span className="tabnums">
            {texto.length.toLocaleString("es-CL")} / {MAX_CHARS_TOTAL.toLocaleString("es-CL")}
            {texto.length > CHUNK_CHARS && (
              <span className="ml-2">
                · en {Math.min(MAX_CHUNKS, Math.ceil(texto.length / CHUNK_CHARS))} partes
              </span>
            )}
          </span>
          {texto.length >= MAX_CHARS_TOTAL && (
            <span className="text-redline">alcanzaste el máximo; el resto se recorta</span>
          )}
        </div>
      </div>

      {(errorLocal || error) && (
        <p className="mb-4 rounded border border-line bg-redline-soft px-3 py-2 text-[13px] text-redline">
          {errorLocal || error}
        </p>
      )}

      <Button onClick={onAnalizar} disabled={!texto.trim()}>
        Analizar contrato <ArrowRight size={14} />
      </Button>
    </div>
  );
}
