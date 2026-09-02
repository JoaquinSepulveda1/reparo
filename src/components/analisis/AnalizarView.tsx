"use client";

import { useState } from "react";
import { Dropzone } from "./Dropzone";
import { Resultado } from "./Resultado";
import { analizar, ApiError, type AnalizarResponse } from "@/lib/api";

export function AnalizarView() {
  const [texto, setTexto] = useState("");
  const [fileName, setFileName] = useState("");
  const [analizando, setAnalizando] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState<AnalizarResponse | null>(null);
  // Se congela el texto que se analizó, para que editar el textarea después no
  // desalinee los highlights.
  const [textoAnalizado, setTextoAnalizado] = useState("");

  async function onAnalizar() {
    if (!texto.trim()) return;
    setAnalizando(true);
    setError("");
    try {
      const res = await analizar(texto, fileName || undefined);
      setResultado(res);
      setTextoAnalizado(texto);
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "No pude analizar el contrato. Intentá de nuevo en unos segundos.",
      );
    } finally {
      setAnalizando(false);
    }
  }

  function reset() {
    setResultado(null);
    setTexto("");
    setFileName("");
    setTextoAnalizado("");
    setError("");
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {resultado ? (
        <Resultado
          resultado={resultado}
          contractText={textoAnalizado}
          fileName={fileName}
          onReset={reset}
        />
      ) : (
        <Dropzone
          texto={texto}
          fileName={fileName}
          onChange={(t, f) => {
            setTexto(t);
            setFileName(f);
          }}
          onAnalizar={onAnalizar}
          analizando={analizando}
          error={error}
        />
      )}
    </div>
  );
}
