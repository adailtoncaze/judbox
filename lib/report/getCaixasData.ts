// lib/report/getCaixasData.ts
import { createSupabaseServer } from "@/lib/supabaseServer";
import { getUserServer } from "@/lib/auth/getUserServer";
import type { User } from "@supabase/supabase-js";

export type Filtros = { tipo?: string | null; numero?: string | null };

export type Caixa = {
  id: string;
  numero_caixa: string;                 // ← sua coluna real (text)
  tipo: "processo_administrativo" | "processo_judicial" | "documento_administrativo";
  descricao?: string | null;
  localizacao?: string | null;
  destinacao: "preservar" | "eliminar";
  data_criacao?: string | null;
  data_atualizacao?: string | null;
  user_id?: string | null;
};

export type GetCaixasDataResult = { data: Caixa[]; user: User | null };

function normalizaTipo(input?: string | null) {
  if (!input || input === "todos") return null;

  const v = input.toLowerCase();
  // mapeia possíveis nomes “curtos” usados no UI para os do CHECK
  if (["judicial", "processo_judicial", "proc_jud"].includes(v)) return "processo_judicial";
  if (["processo_administrativo", "adm", "proc_adm", "adm_proc"].includes(v)) return "processo_administrativo";
  if (["documento_administrativo", "docs", "adm_doc", "documentos"].includes(v)) return "documento_administrativo";

  // Se já vier correto, devolve como está
  if (["processo_judicial", "processo_administrativo", "documento_administrativo"].includes(v)) return v;

  return null;
}

export async function getCaixasData(filtros: Filtros): Promise<GetCaixasDataResult> {
  const { user } = await getUserServer();
  if (!user) return { data: [], user: null };

  const supabase = await createSupabaseServer();

  let query = supabase
    .from("caixas")
    .select(
      "id, user_id, numero_caixa, tipo, descricao, localizacao, destinacao, data_criacao, data_atualizacao"
    )
    .eq("user_id", user.id); // mantém filtro por dono (reforça RLS)

  const tipoNormalizado = normalizaTipo(filtros?.tipo);
  if (tipoNormalizado) {
    query = query.eq("tipo", tipoNormalizado);
  }

  if (filtros?.numero) {
    // a sua coluna é text, então compara como string
    query = query.ilike("numero_caixa", `${filtros.numero}%`);
    // se quiser match exato: query = query.eq("numero_caixa", filtros.numero);
  }

  // ordenação estável por tipo e número_caixa (texto)
  query = query.order("tipo", { ascending: true }).order("numero_caixa", { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error("getCaixasData error:", {
      code: (error as any).code,
      message: (error as any).message,
      details: (error as any).details,
      hint: (error as any).hint,
    });
    throw error;
  }

  return { data: (data ?? []) as Caixa[], user };
}
