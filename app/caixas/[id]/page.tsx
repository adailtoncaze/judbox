"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import AuthGuard from "@/components/AuthGuard"
import Header from "@/components/Header"
import { useToast } from "@/hooks/useToast"
import DocumentosAdm from "./DocumentosAdm"
import GlobalLoader from "@/components/GlobalLoader"
import { SkeletonTable } from "@/components/SkeletonTable"
import { CheckIcon, PrinterIcon, ScaleIcon } from "@heroicons/react/24/outline"

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
  const [loadingList, setLoadingList] = useState(true) // lista de processos
  const [loadingAction, setLoadingAction] = useState(false) // salvar/editar/excluir

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

  // 🔹 Scroll lock para modais
  useEffect(() => {
    if (showModal || showConfirm) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
  }, [showModal, showConfirm])

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

  // 🔹 Carregar processos
  async function loadProcessos() {
    setLoadingList(true)

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

    setLoadingList(false)
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
    setLoadingAction(true)

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
    await loadProcessos()
    setLoadingAction(false)

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
    setLoadingAction(true)

    const { error } = await supabase.from("processos").delete().eq("id", deleteId)
    if (error) {
      console.error(error)
      showToast("Erro ao excluir processo", "error")
    } else {
      showToast("Processo excluído com sucesso!", "success")
      await loadProcessos()
    }

    setShowConfirm(false)
    setDeleteId(null)
    setLoadingAction(false)
  }

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
        {/* Loader global apenas para ações CRUD */}
        <GlobalLoader visible={loadingAction} />

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
                <span>
                  <b>Número:</b> {caixa.numero_caixa}
                </span>
                <span>
                  <b>Tipo:</b> {formatTipoCaixa(caixa.tipo)}
                </span>
                <span>
                  <b>Cidade:</b> {caixa.localizacao || "—"}
                </span>
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
            {/* Cabeçalho da seção de processos */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-indigo-700">⚖️ Processos</h2>
              <div className="flex gap-2">
                <button
                  onClick={openCreateModal}
                  className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 flex items-center justify-center cursor-pointer">
                  <span className="mr-3 text-sm font-semibold">Novo Processo</span>
                  <ScaleIcon className="h-6 w-6 text-gray-700" />
                </button>
                {caixa && (caixa.tipo === "processo_judicial" || caixa.tipo === "processo_administrativo") && (
                  <button
                    onClick={() =>
                      window.open(
                        `/etiquetas/${caixa.id}?numero_caixa=${caixa.numero_caixa}&tipo=${caixa.tipo}`,
                        "_blank"
                      )
                    }
                    className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 flex items-center justify-center cursor-pointer">
                    <span className="mr-3 text-sm font-semibold">Etiqueta</span>
                    <PrinterIcon className="h-6 w-6 text-gray-700" />
                  </button>
                )}
              </div>
            </div>

            {/* Tabela de processos */}
            <div className="bg-gray-50 rounded-2xl shadow p-2">
              <table className="w-full text-sm border-separate border-spacing-y-1">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 font-medium">
                    <th className="px-4 py-3 text-left">Número</th>
                    <th className="px-4 py-3 text-left">Ano</th>
                    <th className="px-4 py-3 text-left">Protocolo</th>
                    <th className="px-4 py-3 text-left">Tipo</th>
                    <th className="px-4 py-3 text-left">Classe</th>
                    <th className="px-4 py-3 text-left">Volumes</th>
                    <th className="px-4 py-3 text-left">Nº Caixas</th>
                    <th className="px-4 py-3 text-right">Operações</th>
                  </tr>
                </thead>
                {loadingList ? (
                  <SkeletonTable rows={5} />
                ) : (
                  <tbody>
                    {processos.length ? (
                      processos.map((p) => (
                        <tr key={p.id} className="bg-white hover:bg-gray-50">
                          <td className="px-4 py-3">{p.numero_processo}</td>
                          <td className="px-4 py-3">{p.ano}</td>
                          <td className="px-4 py-3">{p.protocolo ?? "—"}</td>
                          <td className="px-4 py-3 capitalize">{p.tipo_processo}</td>
                          <td className="px-4 py-3">{p.classe_processual}</td>
                          <td className="px-4 py-3">{p.quantidade_volumes ?? "—"}</td>
                          <td className="px-4 py-3">{p.numero_caixas ?? "—"}</td>
                          <td className="px-4 py-3 text-right space-x-2">
                            <button
                              onClick={() => handleEdit(p)}
                              className="text-yellow-600 hover:underline cursor-pointer"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => {
                                setDeleteId(p.id)
                                setShowConfirm(true)
                              }}
                              className="text-red-600 hover:underline cursor-pointer"
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
                )}
              </table>
            </div>

            {/* Paginação */}
            {(totalPages > 1 || total > 0) && (
              <div className="flex flex-col md:flex-row justify-between items-center gap-3 mt-4 text-sm text-gray-600">
                <span>Total de registros: {total}</span>
                {totalPages > 1 && (
                  <div className="flex items-center gap-3">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1 rounded-md border disabled:opacity-50 cursor-pointer"
                    >
                      ← Anterior
                    </button>
                    <span>
                      Página {page} de {totalPages}
                    </span>
                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="px-3 py-1 rounded-md border disabled:opacity-50 cursor-pointer"
                    >
                      Próxima →
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Modal Cadastro/Edição */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
            <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-2xl">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-indigo-700">
                  {editing ? "Editar Processo" : "Cadastrar Processo"}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs mb-1 text-gray-700">Tipo</label>
                  <select
                    value={form.tipo_processo}
                    onChange={(e) =>
                      setForm({ ...form, tipo_processo: e.target.value as Processo["tipo_processo"] })
                    }
                    className={inputClass}
                    required
                  >
                    <option value="">Selecione</option>
                    <option value="judicial">Judicial</option>
                    <option value="administrativo">Administrativo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1 text-gray-700">Classe Processual</label>
                  <input
                    list="classes-processuais"
                    type="text"
                    value={form.classe_processual}
                    onChange={(e) => setForm({ ...form, classe_processual: e.target.value })}
                    className={inputClass}
                    placeholder="Digite ou selecione"
                    required
                  />
                  <datalist id="classes-processuais">
                    <option value="Ação de Impugnação de Mandato Eletivo" />
                    <option value="Ação de Investigação Judicial Eleitoral" />
                    <option value="Prestação de Contas" />
                    <option value="Registro de Candidaturas" />
                    <option value="Representação" />
                    <option value="Suspensão dos Direitos Políticos" />
                  </datalist>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1 text-gray-700">Número do Processo</label>
                    <input
                      type="text"
                      value={form.numero_processo}
                      onChange={(e) => setForm({ ...form, numero_processo: e.target.value })}
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1 text-gray-700">Protocolo</label>
                    <input
                      type="text"
                      value={form.protocolo}
                      onChange={(e) => setForm({ ...form, protocolo: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs mb-1 text-gray-700">Ano</label>
                    <input
                      type="number"
                      value={form.ano}
                      onChange={(e) =>
                        setForm({ ...form, ano: safeInt(e.target.value, new Date().getFullYear()) })
                      }
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1 text-gray-700">Qtd. Volumes</label>
                    <input
                      type="number"
                      value={form.quantidade_volumes}
                      onChange={(e) =>
                        setForm({ ...form, quantidade_volumes: safeInt(e.target.value, 1) })
                      }
                      className={inputClass}
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1 text-gray-700">Nº Caixas</label>
                    <input
                      type="number"
                      value={form.numero_caixas}
                      onChange={(e) =>
                        setForm({ ...form, numero_caixas: safeInt(e.target.value, 1) })
                      }
                      className={inputClass}
                      min={1}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs mb-1 text-gray-700">Observação</label>
                  <textarea
                    value={form.observacao}
                    onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="p-3 rounded-lg bg-indigo-100 border border-indigo-300 hover:bg-indigo-200 flex items-center justify-center cursor-pointer">
                    <span className="mr-2 text-sm">
                      {editing ? "Salvar Alterações" : "Salvar Processo"}
                    </span>
                    <CheckIcon className="h-4 w-4 text-gray-700" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de confirmação */}
        {showConfirm && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
            <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm text-center">
              <h2 className="text-lg font-semibold mb-4">Confirmar exclusão</h2>
              <p className="text-sm mb-6">Excluir este processo?</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 rounded-lg border cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                >
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
