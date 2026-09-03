"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  listarComentarios,
  crearComentario,
  resolverComentario,
  borrarComentario,
  type Comentario,
  type NuevoComentario,
} from "@/lib/api";

const POLL_MS = 12_000;

export interface Hilo {
  raiz: Comentario;
  respuestas: Comentario[];
}

/**
 * Comentarios de un contrato, con refresco por polling (~12s) mientras la
 * pestaña está visible. `contratoId` null = todavía no hay contrato (análisis
 * sin guardar): no hace nada hasta que llega.
 */
export function useComentarios(contratoId: string | null) {
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [yo, setYo] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const primerFetch = useRef(true);
  // Ref para que crear/resolver/borrar no queden stale cuando el id llega tarde
  // (auto-guardado al primer comentario).
  const idRef = useRef<string | null>(contratoId);
  idRef.current = contratoId;

  const refetch = useCallback(async () => {
    const contratoId = idRef.current;
    if (!contratoId) return;
    if (primerFetch.current) setLoading(true);
    try {
      const { comentarios: c, yo: y } = await listarComentarios(contratoId);
      setComentarios(c);
      setYo(y);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar los comentarios.");
    } finally {
      primerFetch.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    primerFetch.current = true;
    setComentarios([]);
    if (!contratoId) return;
    refetch();
    const tick = setInterval(() => {
      if (!document.hidden) refetch();
    }, POLL_MS);
    const onVis = () => {
      if (!document.hidden) refetch();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(tick);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [contratoId, refetch]);

  const crear = useCallback(
    async (body: NuevoComentario, idOverride?: string) => {
      const id = idOverride ?? idRef.current;
      if (!id) throw new Error("Guardá el análisis antes de comentar.");
      // Si el id recién se creó (auto-guardado), adelantamos el ref para el poll.
      if (idOverride) idRef.current = idOverride;
      const nuevo = await crearComentario(id, body);
      setComentarios((prev) => [...prev, nuevo]);
      return nuevo;
    },
    [],
  );

  const resolver = useCallback(
    async (comentarioId: string, resuelto: boolean) => {
      const id = idRef.current;
      if (!id) return;
      setComentarios((prev) => prev.map((c) => (c.id === comentarioId ? { ...c, resuelto } : c)));
      try {
        await resolverComentario(id, comentarioId, resuelto);
      } catch {
        refetch();
      }
    },
    [refetch],
  );

  const borrar = useCallback(
    async (comentarioId: string) => {
      const id = idRef.current;
      if (!id) return;
      setComentarios((prev) =>
        prev.filter((c) => c.id !== comentarioId && c.parent_id !== comentarioId),
      );
      try {
        await borrarComentario(id, comentarioId);
      } catch {
        refetch();
      }
    },
    [refetch],
  );

  const hilos = useMemo<Hilo[]>(() => {
    const raices = comentarios.filter((c) => !c.parent_id);
    const porPadre = new Map<string, Comentario[]>();
    for (const c of comentarios) {
      if (!c.parent_id) continue;
      const arr = porPadre.get(c.parent_id) ?? [];
      arr.push(c);
      porPadre.set(c.parent_id, arr);
    }
    return raices.map((raiz) => ({
      raiz,
      respuestas: (porPadre.get(raiz.id) ?? []).sort(
        (a, b) => a.created_at.localeCompare(b.created_at),
      ),
    }));
  }, [comentarios]);

  return { comentarios, hilos, yo, loading, error, refetch, crear, resolver, borrar };
}
