"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MAX_CHARS } from "@/lib/contrato/constantes";
import { extraerTexto, ExtraccionError } from "@/lib/contrato/extraer";

interface Props {
  texto: string;
  fileName: string;
  onChange: (texto: string, fileName: string) => void;
  onAnalizar: () => void;
  analizando: boolean;
  error: string;
}

export function Dropzone({ texto, fileName, onChange, onAnalizar, analizando, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [leyendo, setLeyendo] = useState(false);
  const [errorLocal, setErrorLocal] = useState("");

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
      onChange(raw.slice(0, MAX_CHARS), file.name);
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

  return (
    <>
      <p className="eyebrow mb-2.5">Paso 1 — Subí o pegá tu contrato</p>
      <h1 className="mb-2.5 font-serif text-[30px] font-medium leading-tight">
        Subí un contrato y te decimos qué revisar primero
      </h1>
      <p className="mb-7 max-w-[56ch] text-[15px] text-ink-2">
        Detectamos las cláusulas riesgosas o atípicas y les asignamos un puntaje, con el marco
        legal chileno como referencia.
      </p>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFile(e.dataTransfer.files?.[0]);
        }}
        className="mb-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded border border-dashed border-line bg-paper-raised px-6 py-8"
      >
        <Upload size={20} className="text-ink-3" />
        <span className="text-[14px] text-ink-2">
          {fileName
            ? `Archivo cargado: ${fileName}`
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

      <p className="mb-1 text-center font-mono text-[11px] text-ink-3">
        — o pegá el texto directamente —
      </p>
      <textarea
        value={texto}
        onChange={(e) => onChange(e.target.value.slice(0, MAX_CHARS), "")}
        placeholder="Pegá aquí el texto del contrato..."
        rows={10}
        className="w-full resize-y rounded-[2px] border border-line bg-paper-raised p-4 font-serif text-[14.5px] text-ink outline-none focus:border-ink"
      />
      <div className="mb-6 mt-2 flex items-center justify-between">
        <span className="font-mono text-[11px] text-ink-3">
          {texto.length}/{MAX_CHARS} caracteres
        </span>
        {leyendo && (
          <span className="flex items-center gap-1 font-mono text-[11px] text-ink-3">
            <Loader2 size={12} className="animate-spin" /> leyendo archivo…
          </span>
        )}
      </div>

      {(errorLocal || error) && (
        <p className="mb-4 text-[13px] text-redline">{errorLocal || error}</p>
      )}

      <Button onClick={onAnalizar} disabled={!texto.trim() || analizando}>
        {analizando ? (
          <>
            <Loader2 size={14} className="animate-spin" /> Analizando cláusulas…
          </>
        ) : (
          <>
            Analizar contrato <ChevronRight size={14} />
          </>
        )}
      </Button>
    </>
  );
}
