// lib/report/getOverviewData.ts
import { getUserServer } from "@/lib/auth/getUserServer";
import { createSupabaseServer } from "@/lib/supabaseServer";

const TBL_PROCESSOS = "processos";
const COL_PROC_TIPO = "tipo_processo"; // "judicial" | "administrativo"
const TBL_DOCS_ADM = "documentos_adm";

export type OverviewMetrics = {
  totalCaixas: number;
  destPreservar: number;
  destEliminar: number;
  pTot: number;
  pJud: number;
  pAdm: number;
  docsAdm: number;
  cxJud: number;
  cxAdm: number;
  cxDoc: number;
  usuario: string;
};

export async function getOverviewData(): Promise<OverviewMetrics> {
  const { user } = await getUserServer();
  if (!user) throw new Error("Não autenticado");
  const supabase: any = await createSupabaseServer();

  // Caixas do usuário
  const { data: caixas } = await supabase
    .from("caixas")
    .select("id, tipo, destinacao, user_id")
    .eq("user_id", user.id);

  const rows = (caixas ?? []) as Array<{ id: string; tipo: string | null; destinacao: string | null }>;
  const totalCaixas = rows.length;
  const destPreservar = rows.filter((r) => r.destinacao === "preservar").length;
  const destEliminar = rows.filter((r) => r.destinacao === "eliminar").length;

  // Helper
  async function headCount(table: string, filters?: Record<string, string>): Promise<number> {
    let q = supabase.from(table).select("id", { count: "exact", head: true });
    if (filters) for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
    const { count } = await q;
    return count ?? 0;
  }

  // Processos / Docs
  const [pTot, pJud, pAdm] = await Promise.all([
    headCount(TBL_PROCESSOS),
    headCount(TBL_PROCESSOS, { [COL_PROC_TIPO]: "judicial" }),
    headCount(TBL_PROCESSOS, { [COL_PROC_TIPO]: "administrativo" }),
  ]);

  const docsAdm = await headCount(TBL_DOCS_ADM, { user_id: user.id });

  // Caixas por tipo
  const cxJud = rows.filter((r) => r.tipo === "processo_judicial").length;
  const cxAdm = rows.filter((r) => r.tipo === "processo_administrativo").length;
  const cxDoc = rows.filter((r) => r.tipo === "documento_administrativo").length;

  return {
    totalCaixas,
    destPreservar,
    destEliminar,
    pTot,
    pJud,
    pAdm,
    docsAdm,
    cxJud,
    cxAdm,
    cxDoc,
    usuario: user.email ?? "—",
  };
}
