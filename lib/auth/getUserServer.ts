// lib/auth/getUserServer.ts
import type { User } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabaseServer";

type GetUserServerResult = { user: User | null };

export async function getUserServer(): Promise<GetUserServerResult> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return { user: null }; // ✅ sem 'as const'
  return { user };
}
