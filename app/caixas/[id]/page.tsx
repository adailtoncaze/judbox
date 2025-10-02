"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import AuthGuard from "@/components/AuthGuard"
import Header from "@/components/Header"
import { useToast } from "@/hooks/useToast"
import DocumentosAdm from "./DocumentosAdm"

type Caixa = {
  id: string
  numero_caixa: string
  tipo: "processo_administrativo" | "processo_judicial" | "documento_administrativo"
  localizacao?: string | null
  destinacao?: "preservar" | "eliminar" | null
}

type Processo = {
  id: string
  tipo_processo: "administrativo" | "judicial"
  classe_processual: string
  numero_processo: string
  protocolo: string | null
  ano: number
  quantidade_volumes: number | null
  numero_caixas: number | null
  observacao: string | null
  caixa_id?: string
}

const formatTipoCaixa = (v: Caixa["tipo"]) =>
  v === "processo_judicial"
    ? "Processo Judicial"
    : v === "processo_administrativo"
    ? "Processo Administrativo"
    : "Documento Administrativo"

export default function CaixaDetailPage() {
  const { showToast } = useToast()
  const params = useParams()
  const caixaId = params?.id as string

  const [caixa, setCaixa] = useState<Caixa | null>(null)
  const [loadingCaixa, setLoadingCaixa] = useState(true)

  const [processos, setProcessos] = useState<Processo[]>([])
  const [loadingProc, setLoadingProc] = useState(true)

  // paginação
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [total, setTotal] = useState(0)

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Processo | null>(null)

  const [showConfirm, setShowConfirm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [form, setForm] = useState({
    tipo_processo: "" as Processo["tipo_processo"] | "",
    classe_processual: "",
    numero_processo: "",
    protocolo: "",
    ano: new Date().getFullYear(),
    quantidade_volumes: 1,
    numero_caixas: 1,
    observacao: "",
  })

  const inputClass =
    "w-full border border-gray-200 rounded-md px-3 py-1.5 text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"

  const safeInt = (v: string, fb = 0) => {
    const n = parseInt(v, 10)
    return Number.isFinite(n) ? n : fb
  }

  // 🔹 Carregar dados da caixa
  async function loadCaixa() {
    setLoadingCaixa(true)
    const { data, error } = await supabase.from("caixas").select("*").eq("id", caixaId).single()
    if (error) {
      console.error(error)
      showToast("Erro ao carregar caixa", "error")
    }
    setCaixa((data || null) as Caixa | null)
    setLoadingCaixa(false)
  }

  // 🔹 Carregar processos (com paginação)
  async function loadProcessos() {
    setLoadingProc(true)

    const start = (page - 1) * pageSize
    const end = start + pageSize - 1

    const { data, error, count } = await supabase
      .from("processos")
      .select("*", { count: "exact" })
      .eq("caixa_id", caixaId)
      .order("ano", { ascending: false })
      .range(start, end)

    if (error) {
      console.error(error)
      showToast("Erro ao carregar processos", "error")
    } else {
      setProcessos((data || []) as Processo[])
      setTotal(count || 0)
    }

    setLoadingProc(false)
  }

  useEffect(() => {
    if (caixaId) {
      loadCaixa()
    }
  }, [caixaId])

  useEffect(() => {
    if (caixaId) {
      loadProcessos()
    }
  }, [caixaId, page])

  // 🔹 Salvar processo
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const payload = {
      ...form,
      ano: Number(form.ano),
      quantidade_volumes: Number(form.quantidade_volumes) || null,
      numero_caixas: Number(form.numero_caixas) || null,
      caixa_id: caixaId,
    }

    if (editing) {
      const { error } = await supabase.from("processos").update(payload).eq("id", editing.id)
      if (error) {
        console.error(error)
        showToast("Erro ao atualizar processo", "error")
      } else {
        showToast("Processo atualizado com sucesso!", "success")
      }
    } else {
      const { error } = await supabase.from("processos").insert([payload])
      if (error) {
        console.error(error)
        showToast("Erro ao cadastrar processo", "error")
      } else {
        showToast("Processo cadastrado com sucesso!", "success")
      }
    }

    setShowModal(false)
    setEditing(null)
    loadProcessos()

    setForm({
      tipo_processo: "",
      classe_processual: "",
      numero_processo: "",
      protocolo: "",
      ano: new Date().getFullYear(),
      quantidade_volumes: 1,
      numero_caixas: 1,
      observacao: "",
    })
  }

  // 🔹 Excluir processo
  const handleDelete = async () => {
    if (!deleteId) return
    const { error } = await supabase.from("processos").delete().eq("id", deleteId)
    if (error) {
      console.error(error)
      showToast("Erro ao excluir processo", "error")
    } else {
      showToast("Processo excluído com sucesso!", "success")
      loadProcessos()
    }
    setShowConfirm(false)
    setDeleteId(null)
  }

  // 🔹 Editar processo
  const handleEdit = (p: Processo) => {
    setEditing(p)
    setForm({
      tipo_processo: p.tipo_processo,
      classe_processual: p.classe_processual,
      numero_processo: p.numero_processo,
      protocolo: p.protocolo ?? "",
      ano: p.ano,
      quantidade_volumes: p.quantidade_volumes ?? 1,
      numero_caixas: p.numero_caixas ?? 1,
      observacao: p.observacao ?? "",
    })
    setShowModal(true)
  }

  const openCreateModal = () => {
    setEditing(null)
    setForm({
      tipo_processo:
        caixa?.tipo === "processo_judicial"
          ? "judicial"
          : caixa?.tipo === "processo_administrativo"
          ? "administrativo"
          : "",
      classe_processual: "",
      numero_processo: "",
      protocolo: "",
      ano: new Date().getFullYear(),
      quantidade_volumes: 1,
      numero_caixas: 1,
      observacao: "",
    })
    setShowModal(true)
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <AuthGuard>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Cabeçalho da Caixa */}
        {loadingCaixa ? (
          <p className="text-gray-500">Carregando caixa...</p>
        ) : !caixa ? (
          <div className="bg-white p-6 rounded-2xl shadow">
            <p className="text-red-600">Caixa não encontrada.</p>
            <Link href="/caixas" className="text-sm text-indigo-600 hover:underline mt-4 block">
              ← Voltar
            </Link>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-2xl shadow">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📦</span>
              <h1 className="text-2xl font-bold text-indigo-700">Caixa {caixa.numero_caixa}</h1>
            </div>
            <div className="mt-4 flex justify-between items-center text-sm text-gray-700">
              <div className="flex flex-wrap gap-x-8 gap-y-2">
                <span><b>Número:</b> {caixa.numero_caixa}</span>
                <span><b>Tipo:</b> {formatTipoCaixa(caixa.tipo)}</span>
                <span><b>Cidade:</b> {caixa.localizacao || "—"}</span>
                <span>
                  <b>Destinação:</b>{" "}
                  {caixa.destinacao === "preservar"
                    ? "Preservar"
                    : caixa.destinacao === "eliminar"
                    ? "Eliminar"
                    : "—"}
                </span>
              </div>
              <Link href="/caixas" className="text-sm text-indigo-600 hover:underline">
                ← Voltar
              </Link>
            </div>
          </div>
        )}

        {/* Se for documentos administrativos */}
        {caixa?.tipo === "documento_administrativo" ? (
          <DocumentosAdm />
        ) : (
          <>
            {/* 🔹 Cabeçalho da seção de processos */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-indigo-700">⚖️ Processos</h2>
              <div className="flex gap-2">
                <button
                  onClick={openCreateModal}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow"
                >
                  + Novo Processo
                </button>

                {/* Botão Imprimir Etiqueta */}
                {(caixa?.tipo === "processo_judicial" || caixa?.tipo === "processo_administrativo") && (
                  <button
                    onClick={() =>
                      window.open(
                        `/etiquetas/${caixa.id}?numero_caixa=${caixa.numero_caixa}&tipo=${caixa.tipo}`,
                        "_blank"
                      )
                    }
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow"
                  >
                    Imprimir Etiqueta
                  </button>
                )}
              </div>
            </div>

            {/* 🔹 Tabela de processos */}
            <div className="bg-gray-50 rounded-2xl shadow p-2">
              <table className="w-full text-sm border-separate border-spacing-y-1">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 font-medium">
                    <th className="px-4 py-3 text-left">Número</th>
                    <th className="px-4 py-3 text-left">Ano</th>
                    <th className="px-4 py-3 text-left">Tipo</th>
                    <th className="px-4 py-3 text-left">Classe</th>
                    <th className="px-4 py-3 text-left">Volumes</th>
                    <th className="px-4 py-3 text-left">Nº Caixas</th>
                    <th className="px-4 py-3 text-left">Protocolo</th>
                    <th className="px-4 py-3 text-right">Operações</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingProc ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                        Carregando...
                      </td>
                    </tr>
                  ) : processos.length ? (
                    processos.map((p) => (
                      <tr key={p.id} className="bg-white hover:bg-gray-50">
                        <td className="px-4 py-3">{p.numero_processo}</td>
                        <td className="px-4 py-3">{p.ano}</td>
                        <td className="px-4 py-3">{p.tipo_processo}</td>
                        <td className="px-4 py-3">{p.classe_processual}</td>
                        
                        <td className="px-4 py-3">{p.quantidade_volumes ?? "—"}</td>
                        <td className="px-4 py-3">{p.numero_caixas ?? "—"}</td>
                        <td className="px-4 py-3">{p.protocolo ?? "—"}</td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            onClick={() => handleEdit(p)}
                            className="text-yellow-600 hover:underline"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => {
                              setDeleteId(p.id)
                              setShowConfirm(true)
                            }}
                            className="text-red-600 hover:underline"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-4 py-6 text-center text-gray-500 italic">
                        Nenhum processo cadastrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 🔹 Paginação + contador */}
            {(totalPages > 1 || total > 0) && (
              <div className="flex flex-col md:flex-row justify-between items-center gap-3 mt-4 text-sm text-gray-600">
                <span>Total de registros: {total}</span>
                {totalPages > 1 && (
                  <div className="flex items-center gap-3">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1 rounded-md border disabled:opacity-50"
                    >
                      ← Anterior
                    </button>
                    <span>
                      Página {page} de {totalPages}
                    </span>
                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="px-3 py-1 rounded-md border disabled:opacity-50"
                    >
                      Próxima →
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* 🔹 Modal de cadastro/edição */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
            <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-2xl">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-indigo-700">
                  {editing ? "Editar Processo" : "Cadastrar Processo"}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
              {/* ... resto do formulário (mantido igual) ... */}
            </div>
          </div>
        )}

        {/* 🔹 Modal de confirmação */}
        {showConfirm && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
            <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm text-center">
              <h2 className="text-lg font-semibold mb-4">Confirmar exclusão</h2>
              <p className="text-sm mb-6">Excluir este processo?</p>
              <div className="flex justify-center gap-3">
                <button onClick={() => setShowConfirm(false)} className="px-4 py-2 rounded-lg border">
                  Cancelar
                </button>
                <button onClick={handleDelete} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white">
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AuthGuard>
  )
}
