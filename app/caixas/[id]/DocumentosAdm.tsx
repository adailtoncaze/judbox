"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { useToast } from "@/hooks/useToast"
import { CheckIcon, DocumentTextIcon, PrinterIcon } from "@heroicons/react/24/outline"

type DocumentoAdm = {
  id: string
  especie_documental: string
  data_limite: string | null
  quantidade_caixas: number | null
  numero_caixas: number | null
  observacao: string | null
  caixa_id: string
  user_id: string
}

export default function DocumentosAdm() {
  const params = useParams()
  const caixaId = params?.id as string
  const { showToast } = useToast()

  const [documentos, setDocumentos] = useState<DocumentoAdm[]>([])
  const [loading, setLoading] = useState(true)

  // paginação
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 10

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<DocumentoAdm | null>(null)

  const [showConfirm, setShowConfirm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [form, setForm] = useState({
    especie_documental: "",
    data_limite: "",
    quantidade_caixas: 1,
    numero_caixas: 1,
    observacao: "",
  })

  const inputClass =
    "w-full border border-gray-200 rounded-md px-3 py-1.5 text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500"

  const safeInt = (v: string, fb = 0) => {
    const n = parseInt(v, 10)
    return Number.isFinite(n) ? n : fb
  }

  async function loadDocumentos() {
    setLoading(true)

    const start = (page - 1) * pageSize
    const end = start + pageSize - 1

    const { data, error, count } = await supabase
      .from("documentos_adm")
      .select("*", { count: "exact" })
      .eq("caixa_id", caixaId)
      .order("data_limite", { ascending: false })
      .range(start, end)

    if (error) {
      console.error(error)
      showToast("Erro ao carregar documentos", "error")
    }
    setDocumentos((data || []) as DocumentoAdm[])
    setTotal(count || 0)
    setLoading(false)
  }

  useEffect(() => {
    if (caixaId) loadDocumentos()
  }, [caixaId, page])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
      console.error("Usuário não autenticado", authError)
      showToast("Erro: usuário não autenticado", "error")
      return
    }

    const payload = {
      ...form,
      quantidade_caixas: Number(form.quantidade_caixas) || null,
      numero_caixas: Number(form.numero_caixas) || null,
      caixa_id: caixaId,
      user_id: authData.user.id,
    }

    if (editing) {
      const { error } = await supabase
        .from("documentos_adm")
        .update(payload)
        .eq("id", editing.id)

      if (error) {
        console.error(error)
        showToast("Erro ao atualizar documento", "error")
      } else {
        showToast("Documento atualizado com sucesso!", "success")
      }

      setEditing(null)
      setShowModal(false)
      loadDocumentos()
    } else {
      const { error } = await supabase.from("documentos_adm").insert([payload])
      if (error) {
        console.error(error)
        showToast("Erro ao cadastrar documento", "error")
      } else {
        showToast("Documento cadastrado com sucesso!", "success")
      }
      setShowModal(false)
      loadDocumentos()
    }

    setForm({
      especie_documental: "",
      data_limite: "",
      quantidade_caixas: 1,
      numero_caixas: 1,
      observacao: "",
    })
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const { error } = await supabase.from("documentos_adm").delete().eq("id", deleteId)
    if (error) {
      console.error(error)
      showToast("Erro ao excluir documento", "error")
    } else {
      showToast("Documento excluído com sucesso!", "success")
    }
    setShowConfirm(false)
    setDeleteId(null)
    loadDocumentos()
  }

  const handleEdit = (doc: DocumentoAdm) => {
    setEditing(doc)
    setForm({
      especie_documental: doc.especie_documental,
      data_limite: doc.data_limite ?? "",
      quantidade_caixas: doc.quantidade_caixas ?? 1,
      numero_caixas: doc.numero_caixas ?? 1,
      observacao: doc.observacao ?? "",
    })
    setShowModal(true)
  }

  const openCreateModal = () => {
    setEditing(null)
    setForm({
      especie_documental: "",
      data_limite: "",
      quantidade_caixas: 1,
      numero_caixas: 1,
      observacao: "",
    })
    setShowModal(true)
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-indigo-700">📄 Documentos Administrativos</h2>
        <div className="flex gap-2">
          <button
            onClick={openCreateModal}
            className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 flex items-center justify-center cursor-pointer">
            <span className="mr-3 text-sm font-semibold">Novo Documento</span>
            <DocumentTextIcon className="h-6 w-6" />
          </button>
          <button
            onClick={() =>
              window.open(`/etiquetas/${caixaId}?tipo=documento_administrativo`, "_blank")
            }
            className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 flex items-center justify-center cursor-pointer">
            <span className="mr-3 text-sm font-semibold">Etiqueta</span>
            <PrinterIcon className="h-6 w-6 text-gray-700" />
          </button>
        </div>
      </div>

      <div className="bg-gray-50 rounded-2xl shadow p-2">
        <table className="w-full text-sm border-separate border-spacing-y-1">
          <thead>
            <tr className="bg-gray-100 text-gray-700 font-medium">
              <th className="px-4 py-3 text-left">Espécie Documental</th>
              <th className="px-4 py-3 text-left">Ano Limite</th>
              <th className="px-4 py-3 text-left">Qtd. Caixas</th>
              <th className="px-4 py-3 text-left">Nº Caixas</th>
              <th className="px-4 py-3 text-left">Observação</th>
              <th className="px-4 py-3 text-right">Operações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  Carregando...
                </td>
              </tr>
            ) : documentos.length ? (
              documentos.map((d) => (
                <tr key={d.id} className="bg-white hover:bg-gray-50">
                  <td className="px-4 py-3">{d.especie_documental}</td>
                  <td className="px-4 py-3">{d.data_limite}</td>
                  <td className="px-4 py-3">{d.quantidade_caixas}</td>
                  <td className="px-4 py-3">{d.numero_caixas}</td>
                  <td className="px-4 py-3">{d.observacao ?? "—"}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => handleEdit(d)}
                      className="text-yellow-600 hover:underline cursor-pointer"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        setDeleteId(d.id)
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
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500 italic">
                  Nenhum documento cadastrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação + contador */}
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

      {/* Modal Cadastro */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-indigo-700">
                {editing ? "Editar Documento" : "Cadastrar Documento"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs mb-1 text-gray-700">Espécie Documental</label>
                <input
                  type="text"
                  value={form.especie_documental}
                  onChange={(e) => setForm({ ...form, especie_documental: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs mb-1 text-gray-700">Ano Limite</label>
                  <input
                    type="text"
                    value={form.data_limite}
                    onChange={(e) => setForm({ ...form, data_limite: e.target.value })}
                    className={inputClass}
                    placeholder="Ex: 2025"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs mb-1 text-gray-700">Qtd. Caixas</label>
                  <input
                    type="number"
                    value={form.quantidade_caixas}
                    onChange={(e) =>
                      setForm({ ...form, quantidade_caixas: safeInt(e.target.value, 1) })
                    }
                    className={inputClass}
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
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs mb-1 text-gray-700">Observação</label>
                <textarea
                  value={form.observacao}
                  onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div className="md:col-span-2 flex justify-end mt-1">
                <button
                  type="submit"
                  className="p-3 rounded-lg bg-indigo-100 border border-indigo-300 hover:bg-indigo-200 flex items-center justify-center cursor-pointer">
                    <span className="mr-2 text-sm">{editing ? "Salvar Alterações" : "Salvar Documento"}</span>
                    <CheckIcon className="h-4 w-4 text-gray-700" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Exclusão */}
      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm text-center">
            <h2 className="text-lg font-semibold mb-4">Confirmar exclusão</h2>
            <p className="text-sm mb-6">Excluir este documento?</p>
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
    </div>
  )
}
