import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { emailAutorizado } from "@/lib/env";

/**
 * Puerta de acceso: toda la app queda detrás de Supabase Auth (magic link).
 * Rutas libres: /login, /auth/* (callback), /api/auth/* (pedir el link).
 * Además refresca la sesión de Supabase en cada request (patrón oficial @supabase/ssr).
 */
const RUTAS_PUBLICAS = ["/login", "/auth", "/api/auth"];

function esPublica(pathname: string) {
  return RUTAS_PUBLICAS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = req.nextUrl;
  const autenticado = !!user && emailAutorizado(user.email);

  if (esPublica(pathname)) {
    // Si ya está logueado y va a /login, mandarlo a la app.
    if (autenticado && pathname === "/login") {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return res;
  }

  if (autenticado) return res;

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
