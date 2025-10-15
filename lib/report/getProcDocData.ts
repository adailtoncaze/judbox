import { createSupabaseServer } from "@/lib/supabaseServer";
import { getUserServer } from "@/lib/auth/getUserServer";

export type FiltrosProcDoc = {
  tipo: "todos" | "processo_judicial" | "processo_administrativo" | "documento_administrativo";
  numero?: string | null;
  page?: number | null;
  pageSize?: number | null;
  limit?: number | null;
  offset?: number | null;
};

export type RowProcDoc = {
  id: string;
  caixa_id: string;
  numero_caixa: string | null;
  numero_caixa_num?: number | null;
  tipo_item: "processo_judicial" | "processo_administrativo" | "documento_administrativo";
  classe_processual: string | null;
  especie_documental: string | null;
  numero_processo: string | null;
  protocolo: string | null;
  data_limite: string | null;
  created_at: string | null;
};

export type GetProcDocDataResult = { data: RowProcDoc[]; count: number };

export async function getProcDocData({
  tipo,
  numero,
  page,
  pageSize,
  limit,
  offset,
}: FiltrosProcDoc): Promise<GetProcDocDataResult> {
  const { user } = await getUserServer();
  if (!user) return { data: [], count: 0 };

  const supabase = await createSupabaseServer();

  // usa a view com numero_caixa_num
  let query = supabase
    .from("vw_proc_doc_num")
    .select(
      "id, caixa_id, numero_caixa, numero_caixa_num, tipo_item, classe_processual, especie_documental, numero_processo, protocolo, data_limite, created_at",
      { count: "exact" }
    )
    .eq("user_id", user.id);

  if (tipo && tipo !== "todos") query = query.eq("tipo_item", tipo);
  if (numero) query = query.ilike("numero_caixa", `${numero}%`);

  // ORDEM:
  // - se "todos": agrupar por tipo_item, depois número
  // - senão: só por número (com desempates estáveis)
  if (!tipo || tipo === "todos") {
    query = query
      .order("tipo_item", { ascending: true })
      .order("numero_caixa_num", { ascending: true, nullsFirst: false })
      .order("numero_caixa", { ascending: true })
      .order("id", { ascending: true });
  } else {
    query = query
      .order("numero_caixa_num", { ascending: true, nullsFirst: false })
      .order("numero_caixa", { ascending: true })
      .order("id", { ascending: true });
  }

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
  if (error) throw error;

  return { data: (data ?? []) as RowProcDoc[], count: count ?? 0 };
}
