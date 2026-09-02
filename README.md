# Reparo

Revisión de contratos legales con IA — foco Chile. Next.js 15 (App Router) + TypeScript, Postgres vía Supabase, Gemini, deploy en Vercel.

> **Disclaimer:** Esto es apoyo para la revisión, no reemplaza el criterio de un abogado.

## Estado

| Área | Estado |
|---|---|
| Estructura del proyecto | ✅ |
| Sistema de diseño (`tailwind.config` + `Button/Badge/Card` + tokens + logo) | ✅ |
| Schema Supabase (`supabase/migrations/0001_init.sql`) | ✅ |
| Auth por contraseña compartida (middleware + `/api/login`) | ✅ |
| `POST /api/analizar` (Gemini server-side + precedentes) | ✅ |
| Pantalla principal: subir/pegar, resultado con highlights, aplicar sugerencias | ✅ |
| `POST /api/contratos` (guardar) + `GET` + vista Biblioteca | ✅ |
| Trocear contratos largos (chunking) + vista del documento paginada | ✅ |
| Nombrar el análisis al guardar · descargar Original / Con cambios en PDF (biblioteca) | ✅ |
| Playbook configurable (criterio de riesgo hoy hardcodeado en `prompt.ts`) | ⏳ futuro |

## Setup

```bash
npm install
cp .env.example .env.local   # completar valores
```

### Variables de entorno

| Var | Descripción |
|---|---|
| `GEMINI_API_KEY` | Key de Gemini (acepta también `GOOGLE_API_KEY`). **Solo servidor.** Nunca con prefijo `NEXT_PUBLIC_`. |
| `GEMINI_MODEL` | Opcional. Default `gemini-3.6-flash`. |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key. Solo servidor; bypassa RLS. |
| `APP_PASSWORD` | Contraseña que se escribe en `/login`. |
| `SESSION_SECRET` | Valor aleatorio largo (`openssl rand -hex 32`). Es lo que guarda la cookie. |

### Base de datos

Crear un proyecto en Supabase (tier gratis) y aplicar la migración:

```bash
# opción A: CLI de Supabase
supabase link --project-ref <ref>
supabase db push

# opción B: pegar supabase/migrations/0001_init.sql en el SQL Editor
```

### Correr

```bash
npm run dev        # http://localhost:3000  → redirige a /login
npm run typecheck  # tsc --noEmit
```

## Arquitectura

```
src/
  middleware.ts              Puerta de acceso: cookie de sesión o redirect a /login
  app/
    page.tsx                 Header + AnalizarView
    biblioteca/page.tsx      Header + BibliotecaView
    login/page.tsx           Form de contraseña compartida
    api/
      login/route.ts         Valida APP_PASSWORD → setea cookie HttpOnly
      logout/route.ts        Borra la cookie
      analizar/route.ts      ⭐ POST { texto, nombreArchivo? } → análisis (Gemini)
      contratos/route.ts     POST guarda contrato+findings · GET lista la biblioteca
  lib/
    env.ts                   Acceso centralizado a env vars (server-only)
    auth.ts                  Validación de contraseña / cookie
    gemini.ts                Cliente Gemini (server-only)
    api.ts                   Fetch helpers + tipos para el cliente
    supabase/
      server.ts              Cliente admin (service role, server-only, sin tipos generados)
      types.ts               Tipos de lectura de las 2 tablas
    analisis/
      prompt.ts              System prompt — replicado del prototipo
      precedentes.ts         getPrecedentsDigest() vía Postgres
      schema.ts              Zod + parseAnalisis() + AnalisisParseError / AnalisisModeloError
      analizar.ts            Pipeline: split en chunks → precedentes → Gemini x chunk en paralelo → fusión
    contrato/
      constantes.ts          CHUNK_CHARS / MAX_CHUNKS / MAX_CHARS_TOTAL / PAGE_CHARS, DISCLAIMER
      chunking.ts            puntosDeCorte() + dividirEnChunks() — corte por límites naturales
      paginacion.ts          paginar() / segmentosPorPagina() / paginaPorFinding() — vista paginada
      matching.ts            normalizeChars / findExcerptRange / buildSegments / buildEditedText
      extraer.ts             Extracción de texto en el cliente (.txt / .docx mammoth / .pdf pdfjs)
      pdf.ts                 descargarContratoPdf() — exporta un contrato a PDF (jspdf, dynamic import)
    design/tokens.ts         Paleta + riskStyle + scoreColor (fuente única; la importa tailwind.config)
  components/
    brand/Logo.tsx           SVG documento + lupa
    ui/{Button,Badge,Card}.tsx
    app/{Header,Disclaimer}.tsx
    analisis/{AnalizarView,Dropzone,Resultado,DocumentoConHighlights,FindingCard,ScoreRing}.tsx
    biblioteca/BibliotecaView.tsx
```

### `POST /api/analizar`

Request:

```json
{ "texto": "CLÁUSULA PRIMERA...", "nombreArchivo": "contrato.docx" }
```

Respuesta `200`:

```json
{
  "score_general": 62,
  "resumen": "Contrato con cláusulas de terminación y datos desequilibradas.",
  "findings": [
    {
      "excerpt": "...fragmento exacto del contrato...",
      "categoria": "Terminación",
      "nivel_riesgo": "alto",
      "score_riesgo": 78,
      "problema": "Plazo de aviso demasiado corto para el proveedor.",
      "sugerencia": "Aumentar el preaviso a 60 días."
    }
  ],
  "uso_precedentes": true,
  "meta": { "truncado": false, "chars_analizados": 4210, "nombre_archivo": "contrato.docx" }
}
```

Errores:

| Código | Caso |
|---|---|
| `400` | body inválido / contrato vacío |
| `401` | sin sesión (lo corta el middleware) |
| `422` | el modelo respondió pero el JSON no parsea → `{ error, detalle, respuesta_cruda }` |
| `429` | cuota de Gemini saturada |
| `502` | error de la API de Gemini, o respuesta bloqueada/truncada/vacía |
| `500` | inesperado (ej. falta una env var) |

**Aprendizaje sin reentrenamiento:** antes de cada análisis, `getPrecedentsDigest()` toma los últimos 3 contratos guardados, resume las sugerencias con `aplicada = true` y las inyecta en el system prompt como "precedentes".

### Notas de alcance (v1, a propósito)

- Sin multi-tenancy ni concepto de "empresa": una sola biblioteca compartida.
- Sin login por usuario: una contraseña compartida para toda la app.
- Sin playbook configurable: el criterio de riesgo va hardcodeado en `prompt.ts`.
- Contratos de hasta `MAX_CHARS_TOTAL` (`CHUNK_CHARS` × `MAX_CHUNKS` = 9000 × 4 = 36 000).
  Se analizan en trozos, una llamada a Gemini por trozo **en paralelo** (1 reintento por
  trozo; si uno falla se corta todo), y después se fusionan: findings dedupe + orden por
  riesgo + tope 10; `score_general` = `max·0.7 + promedio·0.3`; `resumen` del trozo peor.
  Lo que exceda 36 000 se trunca y la UI lo avisa. La vista del documento va **paginada**
  (`PAGE_CHARS`), navegable, y al clickear un finding salta a su página.
- Parseo de archivos (`.docx` con `mammoth`, `.pdf` con `pdfjs-dist`, `.txt`) se hace
  en el cliente y se manda `texto` ya extraído a `/api/analizar` — igual que el prototipo.
