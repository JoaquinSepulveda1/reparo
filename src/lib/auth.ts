import { SESSION_COOKIE, env } from "@/lib/env";

/**
 * Auth mínima: UNA contraseña compartida protege toda la app.
 * No hay usuarios ni multi-tenancy. Al iniciar sesión, la cookie
 * `reparo_session` (HttpOnly) guarda SESSION_SECRET; el middleware compara
 * contra ese mismo valor en cada request.
 */

export { SESSION_COOKIE };

export function passwordEsValida(intento: string): boolean {
  return timingSafeEqual(intento, env.appPassword());
}

export function cookieDeSesionEsValida(valor: string | undefined): boolean {
  if (!valor) return false;
  return timingSafeEqual(valor, env.sessionSecret());
}

export function valorCookieSesion(): string {
  return env.sessionSecret();
}

/** Comparación en tiempo (aprox.) constante, sin depender de node:crypto. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** 30 días. */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;
