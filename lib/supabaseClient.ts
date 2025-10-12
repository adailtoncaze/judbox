"use client";

import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Client de navegador que usa COOKIES (compatível com SSR/middleware).
 * Isso permite que o servidor enxergue a sessão do usuário.
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

/**
 * Mantém compatibilidade com imports existentes:
 *   import { createClient } from "@/lib/supabaseClient"
 * Agora esse createClient é o createBrowserClient do @supabase/ssr.
 */
export { createBrowserClient as createClient };


