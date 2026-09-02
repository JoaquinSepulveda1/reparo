import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, cookieDeSesionEsValida } from "@/lib/auth";

/**
 * Puerta de acceso: toda la app queda detrás de la contraseña compartida.
 * Rutas libres: /login y /api/login (y los assets, excluidos en `matcher`).
 */
const RUTAS_PUBLICAS = ["/login", "/api/login"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (RUTAS_PUBLICAS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (cookieDeSesionEsValida(cookie)) {
    return NextResponse.next();
  }

  // API → 401 JSON. Páginas → redirect a /login con ?next=
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // Todo salvo assets estáticos de Next y el favicon.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
