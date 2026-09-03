/**
 * Acceso centralizado a variables de entorno del servidor.
 * Importar SOLO desde código server (API routes, server components, middleware),
 * salvo las `NEXT_PUBLIC_*` que también sirven en el browser.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}. Revisá .env.local (o la config de Vercel).`,
    );
  }
  return value;
}

export const env = {
  geminiApiKey: () => {
    const v = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!v) {
      throw new Error(
        "Falta GEMINI_API_KEY (o GOOGLE_API_KEY). Revisá .env.local (o la config de Vercel).",
      );
    }
    return v;
  },
  geminiModel: () => process.env.GEMINI_MODEL || "gemini-3.6-flash",

  supabaseUrl: () => required("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: () => required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: () => required("SUPABASE_SERVICE_ROLE_KEY"),

  /**
   * Emails autorizados a entrar (lista blanca), separados por coma.
   * Vacío o sin definir = nadie entra (falla cerrado).
   */
  allowedEmails: (): string[] =>
    (process.env.ALLOWED_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
};

export function emailAutorizado(email: string | null | undefined): boolean {
  if (!email) return false;
  const lista = env.allowedEmails();
  return lista.includes(email.trim().toLowerCase());
}
