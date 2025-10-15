import { createSupabaseServer } from "@/lib/supabaseServer";
import { getUserServer } from "@/lib/auth/getUserServer";
import type { User } from "@supabase/supabase-js";

export type TipoProcDoc =
  | "todos"
  | "processo_judicial"
  | "processo_administrativo"
  | "documento_administrativo";

export type ProcDocItem = {
  id: string;
  caixa_id: string;
  numero_caixa: string | null;
  tipo_item: Exclude<TipoProcDoc, "todos">;
  classe_processual: string | null;
  especie_documental: string | null;
  numero_processo: string | null;
  protocolo: string | null;
  data_limite: string | null;
  created_at: string | null;
  user_id?: string | null;
};

export type GetProcDocInput = {
  tipo: TipoProcDoc;
  numero?: string | null;
  page?: number | null;
  pageSize?: number | null;
  limit?: number | null;
  offset?: number | null;
};

export type GetProcDocResult = {
  data: ProcDocItem[];
  count: number;
  user: User | null;
};

function normalizaTipo(input?: string | null): Exclude<TipoProcDoc, "todos"> | null {
  if (!input || input === "todos") return null;
  const v = input.toLowerCase();
  if (["judicial","processo_judicial","proc_jud"].includes(v)) return "processo_judicial";
  if (["administrativo","processo_administrativo","proc_adm","adm_proc"].includes(v)) return "processo_administrativo";
  if (["documento_administrativo","documentos","doc_adm","docs_adm","adm_doc"].includes(v)) return "documento_administrativo";
  if (["processo_judicial","processo_administrativo","documento_administrativo"].includes(v as any)) return v as any;
  return null;
}

export async function getProcDocData({
  tipo,
  numero,
  page,
  pageSize,
  limit,
  offset,
}: GetProcDocInput): Promise<GetProcDocResult> {
  const { user } = await getUserServer();
  if (!user) return { data: [], count: 0, user: null };

  const supabase = await createSupabaseServer();

  let query = supabase
    .from("vw_proc_doc") // ou "vw_proc_doc_mat"
    .select(
      "id, caixa_id, numero_caixa, tipo_item, classe_processual, especie_documental, numero_processo, protocolo, data_limite, created_at, user_id",
      { count: "exact" }
    )
    .eq("user_id", user.id);

  const tipoNorm = normalizaTipo(tipo);

  // 🔹 Filtros
  if (tipoNorm) query = query.eq("tipo_item", tipoNorm);
  if (numero && numero.trim() !== "") {
    query = query.ilike("numero_caixa", `${numero.trim()}%`);
  }

  // 🔹 Ordenação
  if (!tipoNorm) {
    // quando tipo = "todos" → agrupar por tipo
    query = query.order("tipo_item", { ascending: true })
                 .order("numero_caixa", { ascending: true }); // secundário (opcional)
  } else {
    // quando tipo específico → manter recência
    query = query.order("created_at", { ascending: false });
  }

  // 🔹 Paginação
  if (limit != null) {
    const off = offset ?? 0;
    const lim = Math.max(1, limit);
    query = query.range(off, off + lim - 1);
  } else if (pageSize != null && page != null) {
    const ps = Math.max(1, pageSize);
    const pg = Math.max(1, page);
    const off = (pg - 1) * ps;
    query = query.range(off, off + ps - 1);
  }

  const { data, error, count } = await query;
  if (error) {
    console.error("getProcDocData error:", error);
    throw error;
  }

  return { data: (data ?? []) as ProcDocItem[], count: count ?? 0, user };
}
