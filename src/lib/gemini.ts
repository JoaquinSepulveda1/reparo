import "server-only";
import { GoogleGenAI } from "@google/genai";
import { env } from "@/lib/env";

/** Cliente de Gemini. Server-only: la API key jamás llega al browser. */
let cached: GoogleGenAI | null = null;

export function getGemini(): GoogleGenAI {
  if (cached) return cached;
  cached = new GoogleGenAI({ apiKey: env.geminiApiKey() });
  return cached;
}
