"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Dropzone } from "./Dropzone";
import { AnalysisProgress } from "./AnalysisProgress";
import { Resultado } from "./Resultado";
import { analizar, ApiError, type AnalizarResponse } from "@/lib/api";

type Phase = "idle" | "analizando" | "resultado";

export function AnalizarView() {
  const [texto, setTexto] = useState("");
  const [fileName, setFileName] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState<AnalizarResponse | null>(null);
  // Se congela el texto que se analizó, para que editar el textarea después no
  // desalinee los highlights.
  const [textoAnalizado, setTextoAnalizado] = useState("");

  async function onAnalizar() {
    if (!texto.trim()) return;
    setPhase("analizando");
    setError("");
    try {
      const res = await analizar(texto, fileName || undefined);
      setResultado(res);
      setTextoAnalizado(texto);
      setPhase("resultado");
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "No pude analizar el contrato. Intentá de nuevo en unos segundos.",
      );
      setPhase("idle");
    }
  }

  function reset() {
    setResultado(null);
    setTexto("");
    setFileName("");
    setTextoAnalizado("");
    setError("");
    setPhase("idle");
  }

  return (
    <div className={`mx-auto px-4 py-10 sm:px-6 ${phase === "resultado" ? "max-w-6xl" : "max-w-4xl"}`}>
      <AnimatePresence mode="wait">
        {phase === "resultado" && resultado ? (
          <motion.div
            key="resultado"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Resultado
              resultado={resultado}
              contractText={textoAnalizado}
              fileName={fileName}
              onReset={reset}
            />
          </motion.div>
        ) : phase === "analizando" ? (
          <AnalysisProgress key="progress" fileName={fileName || undefined} />
        ) : (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Dropzone
              texto={texto}
              fileName={fileName}
              onChange={(t, f) => {
                setTexto(t);
                setFileName(f);
              }}
              onAnalizar={onAnalizar}
              error={error}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
