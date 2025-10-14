import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: { headers: req.headers } });
  const { pathname } = req.nextUrl;

  // Supabase SSR (renova sessão)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  await supabase.auth.getUser();

  // Cabeçalhos base
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // ✅ Exceções que podem ser iframadas pelo mesmo domínio
  if (pathname.startsWith("/api/pdf") || pathname.startsWith("/relatorios/caixas/preview")) {
    res.headers.set(
      "Content-Security-Policy",
      "frame-ancestors 'self'; object-src 'none'; base-uri 'self'"
    );
    res.headers.set("X-Frame-Options", "SAMEORIGIN");
  } else {
    // 🔒 Demais rotas seguem não-iframáveis
    res.headers.set(
      "Content-Security-Policy",
      "frame-ancestors 'none'; object-src 'none'; base-uri 'self'"
    );
  }

  return res;
}

export const config = {
  matcher: [
    "/relatorios/caixas/preview",
    "/api/pdf",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
