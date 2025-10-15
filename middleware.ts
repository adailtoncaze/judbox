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

  // --- Configura 'frame-ancestors' dinamicamente ---
  // Formato esperado de NEXT_PUBLIC_FRAME_ANCESTORS: "https://painel.seudominio.com https://outro.com"
  const extraAncestors = (process.env.NEXT_PUBLIC_FRAME_ANCESTORS || "")
    .split(/\s+/)
    .map(s => s.trim())
    .filter(Boolean);

  // Sempre incluir 'self'
  const frameAncestorsList = ["'self'", ...extraAncestors];
  const frameAncestorsValue = `frame-ancestors ${frameAncestorsList.join(" ")};`;

  // Rotas que PODEM ser embevidas em iframe (preview/pdf/etiquetas)
  const isEmbeddableRoute =
    pathname.startsWith("/api/pdf") ||
    pathname.startsWith("/relatorios/caixas/preview") ||
    pathname.startsWith("/etiquetas");

  if (isEmbeddableRoute) {
    // CSP para rotas que permitem iframe
    res.headers.set(
      "Content-Security-Policy",
      [
        frameAncestorsValue,            // ex.: frame-ancestors 'self' https://painel...
        "object-src 'none';",
        "base-uri 'self';",
      ].join(" ")
    );

    // X-Frame-Options só é seguro usar se **apenas** SAMEORIGIN for permitido.
    // Se houver outras origens em frame-ancestors, não envie XFO para evitar conflito.
    if (extraAncestors.length === 0) {
      res.headers.set("X-Frame-Options", "SAMEORIGIN");
    } else {
      res.headers.delete("X-Frame-Options");
    }
  } else {
    // Demais rotas: negar embedding
    res.headers.set(
      "Content-Security-Policy",
      "frame-ancestors 'none'; object-src 'none'; base-uri 'self'"
    );
    // Opcional: reforçar defesa (não é estritamente necessário com CSP)
    // res.headers.set("X-Frame-Options", "DENY");
  }

  return res;
}

export const config = {
  matcher: [
    // rotas já existentes
    "/relatorios/caixas/preview",
    "/api/pdf",
    // adiciona o caminho de etiquetas
    "/etiquetas/:path*",
    // catch-all (exceto assets estáticos e favicon)
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
