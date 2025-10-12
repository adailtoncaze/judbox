// lib/supabaseServer.ts
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * Versão compatível com Next 15+ (cookies() assíncrono).
 * Em RSC, cookies() pode ser readonly; usamos try/catch para set/remove no-op onde não for permitido.
 */
export async function createSupabaseServer() {
  const cookieStore = await cookies(); // ← <<< AQUI o await resolve seu erro

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Em RSC pode ser somente leitura; evita throw
          try {
            // Next 15+: assinatura (name, value, options)
            cookieStore.set?.(name, value, options);
          } catch {}
        },
        remove(name: string, options: CookieOptions) {
          try {
            // remove = set com expiração no passado
            cookieStore.set?.(name, "", { ...options, expires: new Date(0) });
          } catch {}
        },
      },
    }
  );
}
