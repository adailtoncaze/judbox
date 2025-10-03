"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import AuthGuard from "@/components/AuthGuard"
import Header from "@/components/Header"
import {
  ArchiveBoxIcon,
  ClipboardDocumentCheckIcon,
  ScaleIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline"

type Caixa = {
  id: string
  numero_caixa: string
  tipo: "processo_administrativo" | "processo_judicial" | "documento_administrativo"
  descricao?: string | null
}

const formatTipo = (v: Caixa["tipo"]) =>
  v === "processo_judicial"
    ? "Processo Judicial"
    : v === "processo_administrativo"
    ? "Processo Administrativo"
    : "Documento Administrativo"

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)

  // contadores
  const [totalCaixas, setTotalCaixas] = useState(0)
  const [cxJudiciais, setCxJudiciais] = useState(0)
  const [cxAdm, setCxAdm] = useState(0)
  const [cxDocs, setCxDocs] = useState(0)

  const [totalProcessos, setTotalProcessos] = useState(0)
  const [procJudiciais, setProcJudiciais] = useState(0)
  const [procAdm, setProcAdm] = useState(0)

  // recentes
  const [recentes, setRecentes] = useState<Caixa[]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)

      const [{ count: cTot }, { count: cJud }, { count: cAdm }, { count: cDoc }] =
        await Promise.all([
          supabase.from("caixas").select("*", { count: "exact", head: true }),
          supabase.from("caixas").select("*", { count: "exact", head: true }).eq("tipo", "processo_judicial"),
          supabase.from("caixas").select("*", { count: "exact", head: true }).eq("tipo", "processo_administrativo"),
          supabase.from("caixas").select("*", { count: "exact", head: true }).eq("tipo", "documento_administrativo"),
        ])

      setTotalCaixas(cTot ?? 0)
      setCxJudiciais(cJud ?? 0)
      setCxAdm(cAdm ?? 0)
      setCxDocs(cDoc ?? 0)

      const [{ count: pTot }, { count: pJud }, { count: pAdm }] = await Promise.all([
        supabase.from("processos").select("*", { count: "exact", head: true }),
        supabase.from("processos").select("*", { count: "exact", head: true }).eq("tipo_processo", "judicial"),
        supabase.from("processos").select("*", { count: "exact", head: true }).eq("tipo_processo", "administrativo"),
      ])

      setTotalProcessos(pTot ?? 0)
      setProcJudiciais(pJud ?? 0)
      setProcAdm(pAdm ?? 0)

      const { data: cxRecentes } = await supabase
        .from("caixas")
        .select("*")
        .order("data_criacao", { ascending: false })
        .limit(6)

      setRecentes((cxRecentes || []) as Caixa[])
      setLoading(false)
    }

    load()
  }, [])

  return (
    <AuthGuard>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
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

        {/* Estatísticas principais */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardStat title="Caixas" value={totalCaixas} icon={<ArchiveBoxIcon className="h-6 w-6 text-indigo-600" />} />
          <CardStat title="Processos" value={totalProcessos} icon={<ClipboardDocumentCheckIcon className="h-6 w-6 text-indigo-600" />} />
          <CardStat title="Proc. Judiciais" value={procJudiciais} icon={<ScaleIcon className="h-6 w-6 text-indigo-600" />} />
          <CardStat title="Proc. Administrativos" value={procAdm} icon={<DocumentTextIcon className="h-6 w-6 text-indigo-600" />} />
        </section>

        {/* Distribuição + Recentes */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl shadow-sm p-5 hover:shadow-md transition">
            <h2 className="font-semibold text-indigo-700 mb-3">Caixas por tipo</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between"><span>Processos Judiciais</span><b>{cxJudiciais}</b></li>
              <li className="flex justify-between"><span>Processos Administrativos</span><b>{cxAdm}</b></li>
              <li className="flex justify-between"><span>Documentos Administrativos</span><b>{cxDocs}</b></li>
            </ul>
            <Link href="/caixas" className="inline-block mt-4 text-indigo-700 hover:underline text-sm">
              Ver todas as caixas →
            </Link>
          </div>

          <div className="lg:col-span-2 bg-indigo-50/50 border border-indigo-100 rounded-xl shadow-sm p-5 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-indigo-700">Caixas recentes</h2>
              <Link href="/caixas" className="text-sm text-indigo-700 hover:underline">
                abrir lista →
              </Link>
            </div>

            {loading ? (
              <p className="text-gray-500 text-sm">Carregando...</p>
            ) : recentes.length ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {recentes.map((cx) => (
                  <Link
                    key={cx.id}
                    href={`/caixas/${cx.id}`}
                    className="border border-indigo-100 rounded-lg p-3 bg-white/80 hover:shadow-sm hover:border-indigo-200 transition"
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
  )
}

function CardStat({ title, value, icon }: { title: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl shadow-sm p-5 flex flex-col gap-2 hover:shadow-md transition">
      <div className="flex items-center gap-2 text-gray-600 text-sm">
        {icon}
        <span>{title}</span>
      </div>
      <div className="text-2xl font-semibold text-gray-800">{value}</div>
    </div>
  )
}
