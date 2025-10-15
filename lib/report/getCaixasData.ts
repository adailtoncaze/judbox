// lib/report/getCaixasData.ts
import { createSupabaseServer } from "@/lib/supabaseServer";
import { getUserServer } from "@/lib/auth/getUserServer";
import type { User } from "@supabase/supabase-js";

export type Filtros = { tipo?: string | null; numero?: string | null };

export type Caixa = {
  id: string;
  numero_caixa: string;
  tipo: "processo_administrativo" | "processo_judicial" | "documento_administrativo";
  descricao?: string | null;
  localizacao?: string | null;
  destinacao: "preservar" | "eliminar";
  data_criacao?: string | null;
  data_atualizacao?: string | null;
  user_id?: string | null;
};

export type GetCaixasDataInput = Filtros & {
  page?: number | null;     // 1-based
  pageSize?: number | null; // itens por página
  limit?: number | null;    // alternativa direta
  offset?: number | null;
};

export type GetCaixasDataResult = { data: Caixa[]; count: number; user: User | null };

function normalizaTipo(input?: string | null) {
  if (!input || input === "todos") return null;
  const v = input.toLowerCase();
  if (["judicial", "processo_judicial", "proc_jud"].includes(v)) return "processo_judicial";
  if (["processo_administrativo", "adm", "proc_adm", "adm_proc"].includes(v)) return "processo_administrativo";
  if (["documento_administrativo", "docs", "adm_doc", "documentos"].includes(v)) return "documento_administrativo";
  if (["processo_judicial", "processo_administrativo", "documento_administrativo"].includes(v)) return v;
  return null;
}

export async function getCaixasData({
  tipo,
  numero,
  page,
  pageSize,
  limit,
  offset,
}: GetCaixasDataInput): Promise<GetCaixasDataResult> {
  const { user } = await getUserServer();
  if (!user) return { data: [], count: 0, user: null };

  const supabase = await createSupabaseServer();

  let query = supabase
    .from("caixas")
    .select(
      "id, user_id, numero_caixa, tipo, descricao, localizacao, destinacao, data_criacao, data_atualizacao",
      { count: "exact" } // 👈 total real
    )
    .eq("user_id", user.id);

  const tipoNormalizado = normalizaTipo(tipo);
  if (tipoNormalizado) {
    query = query.eq("tipo", tipoNormalizado);
  }

  if (numero) {
    query = query.ilike("numero_caixa", `${numero}%`);
  }

  // Ordenação (mantive sua ordem anterior)
  query = query.order("tipo", { ascending: true }).order("numero_caixa", { ascending: true });

  // Paginação
  if (limit != null) {
    const off = offset ?? 0;
    const lim = Math.max(1, limit);
    query = query.range(off, off + lim - 1);
  } else if (page && pageSize) {
    const ps = Math.max(1, pageSize);
    const pg = Math.max(1, page);
    const off = (pg - 1) * ps;
    query = query.range(off, off + ps - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("getCaixasData error:", {
      code: (error as any).code,
      message: (error as any).message,
      details: (error as any).details,
      hint: (error as any).hint,
    });
    throw error;
  }

  return { data: (data ?? []) as Caixa[], count: count ?? 0, user };
}
