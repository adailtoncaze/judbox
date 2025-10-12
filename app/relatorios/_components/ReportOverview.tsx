import { getUserServer } from "@/lib/auth/getUserServer";
import { createSupabaseServer } from "@/lib/supabaseServer";
import Donut from "./charts/Donut";
import Bars from "./charts/Bars";

// Processos — exatamente como na Dashboard
const TBL_PROCESSOS = "processos";
const COL_PROC_TIPO = "tipo_processo"; // "judicial" | "administrativo"

// Documentos Administrativos
const TBL_DOCS_ADM = "documentos_adm";

export default async function ReportOverview() {
    const { user } = await getUserServer();
    const supabase: any = await createSupabaseServer(); // tipagem leve

    // ---------- CAIXAS (KPIs) ----------
    const { data: caixas, error: caixasErr } = await supabase
        .from("caixas")
        .select("id, tipo, destinacao, user_id")
        .eq("user_id", user!.id);

    if (caixasErr) {
        return (
            <div className="mx-auto max-w-[760px] text-gray-900">
                <header className="mb-6">
                    <h1 className="text-xl font-semibold">Relatório Geral</h1>
                </header>
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    Falha ao carregar as caixas.
                </div>
            </div>
        );
    }

    const rows = (caixas ?? []) as Array<{
        id: string;
        tipo: string | null;
        destinacao: string | null;
    }>;
    const totalCaixas = rows.length;
    const destPreservar = rows.filter((r) => r.destinacao === "preservar").length;
    const destEliminar = rows.filter((r) => r.destinacao === "eliminar").length;

    // ---------- Helpers ----------
    async function headCount(
        table: string,
        filters?: Record<string, string>
    ): Promise<number> {
        let q = supabase.from(table).select("id", { count: "exact", head: true });
        if (filters) {
            for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
        }
        const { count } = await q;
        return count ?? 0;
    }

    // ---------- Processos ----------
    const [pTot, pJud, pAdm] = await Promise.all([
        headCount(TBL_PROCESSOS), // RLS deve limitar por user_id
        headCount(TBL_PROCESSOS, { [COL_PROC_TIPO]: "judicial" }),
        headCount(TBL_PROCESSOS, { [COL_PROC_TIPO]: "administrativo" }),
    ]);

    // ---------- Documentos Administrativos ----------
    const docsAdm = await headCount(TBL_DOCS_ADM, { user_id: user!.id });

    // ---------- Caixas por tipo ----------
    const cxJud = rows.filter((r) => r.tipo === "processo_judicial").length;
    const cxAdm = rows.filter((r) => r.tipo === "processo_administrativo").length;
    const cxDoc = rows.filter((r) => r.tipo === "documento_administrativo").length;

    const tipoLabels: Record<string, string> = {
        processo_judicial: "Processos Judiciais",
        processo_administrativo: "Processo Administrativo",
        documento_administrativo: "Documentos Administrativos",
    };

    return (
        <div className="mx-auto max-w-[900px] text-gray-900 overflow-x-hidden print:overflow-visible">
            <header className="mb-6 text-center">
                <h1 className="text-2xl font-semibold">Relatório Geral</h1>
                <p className="text-xs text-gray-600">
                    Visão geral por tipo, itens (processos/docs) e destinação
                </p>
            </header>

            {/* KPIs de caixas */}
            <section className="mb-6 grid grid-cols-1 gap-3 text-center text-xs sm:grid-cols-3">
                <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-gray-500">Total de caixas</p>
                    <p className="mt-1 text-xl font-semibold">{totalCaixas}</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-gray-500">Preservar</p>
                    <p className="mt-1 text-xl font-semibold">{destPreservar}</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-gray-500">Eliminar</p>
                    <p className="mt-1 text-xl font-semibold">{destEliminar}</p>
                </div>
            </section>

            {/* —— LINHA 1: APENAS OS 2 DONUTS —— */}
            <section
                className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2 print:grid-cols-2"
                style={{ breakInside: "avoid" }}
            >
                <div className="rounded-xl border border-gray-200 p-3" style={{ breakInside: "avoid" }}>
                    <div className="aspect-square w-full max-w-[220px] mx-auto">
                        <Donut
                            title="Processos por tipo"
                            data={[
                                { label: "Judiciais", value: pJud },
                                { label: "Administrativos", value: pAdm },
                            ]}
                            colors={["#6366F1", "#10B981"]}
                            padAngle={3}
                            thickness={14}
                            size={140}
                        />
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 p-3" style={{ breakInside: "avoid" }}>
                    <div className="aspect-square w-full max-w-[220px] mx-auto">
                        <Donut
                            title="Caixas por tipo"
                            data={[
                                { label: "Proc. Judiciais", value: cxJud },
                                { label: "Proc. Administrativos", value: cxAdm },
                                { label: "Docs. Administrativos", value: cxDoc },
                            ]}
                            colors={["#6366F1", "#F59E0B", "#10B981"]}
                            padAngle={3}
                            thickness={14}
                            size={140}
                        />
                    </div>
                </div>
            </section>

            {/* —— LINHA 2: BARRAS SOZINHO —— */}
            <section className="mb-6" style={{ breakInside: "avoid" }}>
                <div className="rounded-xl border border-gray-200 p-3 overflow-hidden">
                    <div className="mx-auto w-full max-w-[680px]">  {/* <= limite do card */}
                        <Bars
                            title="Itens (contagem)"
                            data={[
                                { label: "Processos", value: pTot },
                                { label: "Judiciais", value: pJud },
                                { label: "Administrativos", value: pAdm },
                                { label: "Docs. Adm.", value: docsAdm },
                            ]}
                            // sem width/height; o Bars limita para 520px e encolhe se preciso
                            fontSize={9}
                        />
                    </div>
                </div>
            </section>


            {/* Caixas por tipo (números) */}
            <section className="rounded-xl border border-gray-200 p-4 text-sm">
                <h2 className="mb-3 text-sm font-medium text-gray-700">Caixas por tipo</h2>
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {(
                        [
                            "processo_judicial",
                            "processo_administrativo",
                            "documento_administrativo",
                        ] as const
                    ).map((t) => (
                        <li key={t} className="rounded-lg border border-gray-200 p-3">
                            <div className="text-xs text-gray-500">{tipoLabels[t]}</div>
                            <div className="text-xl font-semibold">
                                {t === "processo_judicial"
                                    ? cxJud
                                    : t === "processo_administrativo"
                                        ? cxAdm
                                        : cxDoc}
                            </div>
                        </li>
                    ))}
                </ul>
            </section>

            <style>{`
        @page { size: A4; margin: 12mm; }
        section, header, footer, table, tr, td, th { break-inside: avoid; page-break-inside: avoid; }
      `}</style>
        </div>
    );
}
