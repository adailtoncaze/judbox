"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import AuthGuard from "@/components/AuthGuard";
import Header from "@/components/Header";
import {
  ArchiveBoxIcon,
  ClipboardDocumentCheckIcon,
  ScaleIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { SkeletonCard } from "@/components/SkeletonCard";

/* ============================
 * Tipos e helpers
 * ============================ */
type Caixa = {
  id: string;
  numero_caixa: string;
  tipo: "processo_administrativo" | "processo_judicial" | "documento_administrativo";
  descricao?: string | null;
  data_criacao?: string | null;
};

const formatTipo = (v: Caixa["tipo"]) =>
  v === "processo_judicial"
    ? "Processo Judicial"
    : v === "processo_administrativo"
    ? "Processo Administrativo"
    : "Documento Administrativo";

/* ============================
 * Donut (ajustado – pontas arredondadas de verdade)
 * ============================ */
function Donut({
  data,
  colors,
  title,
  size = 160,
  thickness = 16,
  padAngle = 2,
}: {
  data: { label: string; value: number }[];
  colors: string[];
  title?: string;
  size?: number;
  thickness?: number;
  padAngle?: number; // graus de espaçamento
}) {
  const total = data.reduce((s, d) => s + (isFinite(d.value) && d.value > 0 ? d.value : 0), 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 3; // margem
  const C = 2 * Math.PI * r;
  const gapDeg = Math.min(Math.max(padAngle, 0), 12);
  const gapPx = (gapDeg / 360) * C;

  let acc = 0;
  const slices = data.map((s, i) => {
    const v = isFinite(s.value) && s.value > 0 ? s.value : 0;
    const frac = total > 0 ? v / total : 0;
    const rawLen = frac * C;
    const segLen = Math.max(0, rawLen - gapPx);
    const slice = {
      label: s.label,
      value: v,
      color: colors[i % colors.length],
      dasharray: `${segLen} ${C}`,
      dashoffset: -(acc + gapPx / 2),
    };
    acc += rawLen;
    return slice;
  });

  // furo ligeiramente menor para não “comer” o arredondado do stroke
  const innerRadius = Math.max(0, r - thickness / 2 - 1.2);

  return (
    <figure className="flex flex-col items-center gap-2">
      {title && <figcaption className="text-[11px] text-gray-600">{title}</figcaption>}
      <svg
        className="block w-[160px] max-w-full"
        style={{ height: "160px", overflow: "visible" }}
        viewBox={`0 0 ${size} ${size}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={title || "Donut chart"}
      >
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E5E7EB" strokeWidth={thickness} />
        {slices.map((s, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={s.dasharray}
            strokeDashoffset={s.dashoffset}
          />
        ))}
        <circle cx={cx} cy={cy} r={innerRadius} fill="#fff" />
        <text x={cx} y={cy - 1} textAnchor="middle" fontSize="16" fontWeight={700} fill="#111827">
          {total}
        </text>
        <text x={cx} y={cy + 13} textAnchor="middle" fontSize="10" fill="#6B7280">
          total
        </text>
      </svg>

      <div className="grid grid-cols-1 gap-y-1 text-[10px] text-gray-600 w-[160px]">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />
            <span className="truncate">{s.label}</span>
            <b className="ml-auto tabular-nums">{slices[i].value}</b>
          </div>
        ))}
      </div>
    </figure>
  );
}

/* ============================
 * Barras horizontais
 * ============================ */
function HBarChart({
  data,
  title,
  viewWidth = 520,
  barHeight = 10,
  gap = 10,
  fontSize = 10,
}: {
  data: { label: string; value: number }[];
  title?: string;
  viewWidth?: number;
  barHeight?: number;
  gap?: number;
  fontSize?: number;
}) {
  const rows = data.map((d) => ({ ...d, value: Math.max(0, d.value || 0) }));
  const max = Math.max(1, ...rows.map((r) => r.value));
  const leftPad = 96;
  const rightPad = 38;
  const topPad = 14;
  const bottomPad = 16;
  const lineH = barHeight + gap;
  const viewHeight = topPad + rows.length * lineH + bottomPad;
  const usableW = viewWidth - leftPad - rightPad;

  return (
    <figure className="flex flex-col items-center gap-2 w-full">
      {title && <figcaption className="text-[11px] text-gray-600 text-center">{title}</figcaption>}
      <svg
        className="block w-[520px] max-w-full mx-auto"
        style={{ height: "auto" }}
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <line x1={leftPad} y1={topPad} x2={leftPad} y2={viewHeight - bottomPad + 2} stroke="#E5E7EB" strokeWidth="1" />
        {rows.map((d, i) => {
          const y = topPad + i * lineH + 1;
          const w = Math.round((d.value / max) * usableW);
          return (
            <g key={i}>
              <text x={leftPad - 10} y={y + barHeight * 0.78} textAnchor="end" fontSize={fontSize} fill="#6B7280">
                {d.label}
              </text>
              <rect x={leftPad + 1} y={y} width={w} height={barHeight} rx={6} fill="#6366F1" />
              <text x={leftPad + w + 6} y={y + barHeight * 0.78} fontSize={fontSize} fill="#374151" textAnchor="start">
                {d.value}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

/* ============================
 * Página
 * ============================ */
export default function DashboardPage() {
  const [loading, setLoading] = useState(true);

  // contadores de caixas
  const [totalCaixas, setTotalCaixas] = useState(0);
  const [cxJudiciais, setCxJudiciais] = useState(0);
  const [cxAdm, setCxAdm] = useState(0);
  const [cxDocs, setCxDocs] = useState(0);

  // contadores de processos
  const [totalProcessos, setTotalProcessos] = useState(0);
  const [procJudiciais, setProcJudiciais] = useState(0);
  const [procAdm, setProcAdm] = useState(0);

  // documentos administrativos (TABELA documentos_adm)
  const [docsAdmCount, setDocsAdmCount] = useState(0);

  // destinação caixas
  const [preservar, setPreservar] = useState(0);
  const [eliminar, setEliminar] = useState(0);

  // recentes (duas linhas → 4 itens)
  const [recentes, setRecentes] = useState<Caixa[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      // CAIXAS
      const [{ count: cTot }, { count: cJud }, { count: cAdm }, { count: cDoc }] =
        await Promise.all([
          supabase.from("caixas").select("*", { count: "exact", head: true }),
          supabase.from("caixas").select("*", { count: "exact", head: true }).eq("tipo", "processo_judicial"),
          supabase.from("caixas").select("*", { count: "exact", head: true }).eq("tipo", "processo_administrativo"),
          supabase.from("caixas").select("*", { count: "exact", head: true }).eq("tipo", "documento_administrativo"),
        ]);

      setTotalCaixas(cTot ?? 0);
      setCxJudiciais(cJud ?? 0);
      setCxAdm(cAdm ?? 0);
      setCxDocs(cDoc ?? 0);

      // DESTINAÇÃO
      const [{ count: cPres }, { count: cElim }] = await Promise.all([
        supabase.from("caixas").select("*", { count: "exact", head: true }).eq("destinacao", "preservar"),
        supabase.from("caixas").select("*", { count: "exact", head: true }).eq("destinacao", "eliminar"),
      ]);
      setPreservar(cPres ?? 0);
      setEliminar(cElim ?? 0);

      // PROCESSOS
      const [{ count: pTot }, { count: pJud }, { count: pAdm }] = await Promise.all([
        supabase.from("processos").select("*", { count: "exact", head: true }),
        supabase.from("processos").select("*", { count: "exact", head: true }).eq("tipo_processo", "judicial"),
        supabase.from("processos").select("*", { count: "exact", head: true }).eq("tipo_processo", "administrativo"),
      ]);
      setTotalProcessos(pTot ?? 0);
      setProcJudiciais(pJud ?? 0);
      setProcAdm(pAdm ?? 0);

      // DOCUMENTOS ADMINISTRATIVOS (tabela documentos_adm) — contagem correta
      const { count: dAdm } = await supabase
        .from("documentos_adm")
        .select("*", { count: "exact", head: true });
        // Se precisar filtrar por usuário e o RLS não faz isso, adicione: .eq("user_id", userId)

      setDocsAdmCount(dAdm ?? 0);

      // RECENTES
      const { data: cxRecentes } = await supabase
        .from("caixas")
        .select("*")
        .order("data_criacao", { ascending: false })
        .limit(4);
      setRecentes((cxRecentes || []) as Caixa[]);

      setLoading(false);
    };

    load();
  }, []);

  // dados para gráficos
  const donutProcessos = useMemo(
    () => [
      { label: "Judiciais", value: procJudiciais },
      { label: "Administrativos", value: procAdm },
    ],
    [procJudiciais, procAdm]
  );
  const donutCaixas = useMemo(
    () => [
      { label: "Proc. Judiciais", value: cxJudiciais },
      { label: "Proc. Administrativos", value: cxAdm },
      { label: "Docs. Administrativos", value: cxDocs },
    ],
    [cxJudiciais, cxAdm, cxDocs]
  );
  const donutDest = useMemo(
    () => [
      { label: "Preservar", value: preservar },
      { label: "Eliminar", value: eliminar },
    ],
    [preservar, eliminar]
  );

  // BARRAS: usa o total de DOCUMENTOS (tabela documentos_adm) corretamente
  const barsItens = useMemo(
    () => [
      { label: "Processos", value: totalProcessos },
      { label: "Judiciais", value: procJudiciais },
      { label: "Administrativos", value: procAdm },
      { label: "Docs. Adm.", value: docsAdmCount }, // <-- cálculo correto
    ],
    [totalProcessos, procJudiciais, procAdm, docsAdmCount]
  );

  return (
    <AuthGuard>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6 overflow-x-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-indigo-700">Dashboard</h1>
            <p className="text-gray-600 text-sm">Resumo geral do inventário</p>
          </div>
          <Link
            href="/caixas"
            className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm text-indigo-700 hover:bg-indigo-100 transition"
          >
            Ir para Caixas →
          </Link>
        </div>

        {/* KPIs (harmonizados, sem elementos gráficos) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <>
              <CardStat title="Caixas" value={totalCaixas} icon={<ArchiveBoxIcon className="h-6 w-6 text-indigo-600" />} />
              <CardStat title="Processos" value={totalProcessos} icon={<ClipboardDocumentCheckIcon className="h-6 w-6 text-indigo-600" />} />
              <CardStat title="Proc. Judiciais" value={procJudiciais} icon={<ScaleIcon className="h-6 w-6 text-indigo-600" />} />
              <CardStat title="Proc. Administrativos" value={procAdm} icon={<DocumentTextIcon className="h-6 w-6 text-indigo-600" />} />
            </>
          )}
        </section>

        {/* Donuts */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 print:grid-cols-3" style={{ breakInside: "avoid" }}>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            {loading ? <SkeletonArea /> : <Donut title="Processos por tipo" data={donutProcessos} colors={["#6366F1", "#10B981"]} />}
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            {loading ? <SkeletonArea /> : <Donut title="Caixas por tipo" data={donutCaixas} colors={["#6366F1", "#F59E0B", "#10B981"]} />}
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            {loading ? <SkeletonArea /> : <Donut title="Destinação das caixas" data={donutDest} colors={["#0EA5E9", "#EF4444"]} />}
          </div>
        </section>

        {/* Barras + Recentes (duas linhas) */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5 overflow-hidden">
            {loading ? <SkeletonArea /> : <HBarChart title="Itens (contagem)" data={barsItens} />}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-indigo-700">Caixas recentes</h2>
              <Link href="/caixas" className="text-sm text-indigo-700 hover:underline">
                abrir lista →
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : recentes.length ? (
              <div className="grid grid-cols-2 gap-3">
                {recentes.map((cx) => (
                  <Link
                    key={cx.id}
                    href={`/caixas/${cx.id}`}
                    className="border border-indigo-100 rounded-lg p-3 bg-white hover:shadow-sm hover:border-indigo-200 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Caixa {cx.numero_caixa}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                        {formatTipo(cx.tipo)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{cx.descricao || "—"}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Nenhuma caixa cadastrada ainda.</p>
            )}
          </div>
        </section>
      </main>
    </AuthGuard>
  );
}

/* ============================
 * UI helpers
 * ============================ */
function CardStat({ title, value, icon }: { title: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="bg-white border border-indigo-100 rounded-xl shadow-sm p-5 flex flex-col gap-2 hover:shadow-md transition">
      <div className="flex items-center gap-2 text-gray-600 text-sm">
        {icon}
        <span>{title}</span>
      </div>
      <div className="text-2xl font-semibold text-gray-800">{value}</div>
    </div>
  );
}

function SkeletonArea() {
  return (
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4" />
      <div className="h-4 bg-gray-200 animate-pulse rounded w-2/3" />
      <div className="h-4 bg-gray-200 animate-pulse rounded w-1/2" />
    </div>
  );
}
