/**
 * Acceso centralizado a variables de entorno del servidor.
 * Importar SOLO desde código server (API routes, server components, middleware).
 * Nada acá lleva prefijo NEXT_PUBLIC_ salvo la URL de Supabase.
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
  supabaseServiceRoleKey: () => required("SUPABASE_SERVICE_ROLE_KEY"),

  appPassword: () => required("APP_PASSWORD"),
  sessionSecret: () => required("SESSION_SECRET"),
};

/** Nombre de la cookie de sesión (contraseña compartida). */
export const SESSION_COOKIE = "reparo_session";
