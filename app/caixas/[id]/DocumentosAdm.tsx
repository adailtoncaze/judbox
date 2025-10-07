"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { useToast } from "@/hooks/useToast"
import GlobalLoader from "@/components/GlobalLoader"
import { SkeletonTable } from "@/components/SkeletonTable"
import { CheckIcon, DocumentTextIcon, PrinterIcon } from "@heroicons/react/24/outline"
import ConfirmPasswordModal from "@/components/ConfirmPasswordModal"

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
  const [loadingList, setLoadingList] = useState(true)
  const [loadingAction, setLoadingAction] = useState(false)
  const [numeroCaixa, setNumeroCaixa] = useState<string | null>(null)

  // paginação
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 10

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<DocumentoAdm | null>(null)

  const [showConfirm, setShowConfirm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [loadingEtiqueta, setLoadingEtiqueta] = useState(false)
  const [showEtiqueta, setShowEtiqueta] = useState(false)
  const [etiquetaUrl, setEtiquetaUrl] = useState<string | undefined>(undefined)

  const [form, setForm] = useState({
    especie_documental: "",
    data_limite: "",
    quantidade_caixas: 1,
    observacao: "",
  })

  const inputClass =
    "w-full border border-gray-200 rounded-md px-3 py-1.5 text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"

  const safeInt = (v: string, fb = 0) => {
    const n = parseInt(v, 10)
    return Number.isFinite(n) ? n : fb
  }

  // 🔹 Carrega número da caixa vinculada
  useEffect(() => {
    async function loadCaixaNumero() {
      const { data, error } = await supabase
        .from("caixas")
        .select("numero_caixa")
        .eq("id", caixaId)
        .single()

      if (!error && data) setNumeroCaixa(data.numero_caixa)
    }

    if (caixaId) loadCaixaNumero()
  }, [caixaId])

  async function loadDocumentos() {
    setLoadingList(true)
    const start = (page - 1) * pageSize
    const end = start + pageSize - 1

    const { data, error, count } = await supabase
      .from("documentos_adm")
      .select("*", { count: "exact" })
      .eq("caixa_id", caixaId)
      .order("created_at", { ascending: false })
      .range(start, end)

    if (error) {
      console.error(error)
      showToast("Erro ao carregar documentos", "error")
    }
    setDocumentos((data || []) as DocumentoAdm[])
    setTotal(count || 0)
    setLoadingList(false)
  }

  useEffect(() => {
    if (caixaId) loadDocumentos()
  }, [caixaId, page])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingAction(true)

    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
      console.error("Usuário não autenticado", authError)
      showToast("Erro: usuário não autenticado", "error")
      setLoadingAction(false)
      return
    }

    const payload = {
      ...form,
      quantidade_caixas: Number(form.quantidade_caixas) || null,
      caixa_id: caixaId,
      user_id: authData.user.id,
      // número da caixa será definido automaticamente no banco (trigger)
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
    } else {
      const { error } = await supabase.from("documentos_adm").insert([payload])
      if (error) {
        console.error(error)
        showToast("Erro ao cadastrar documento", "error")
      } else {
        showToast("Documento cadastrado com sucesso!", "success")
      }
    }

    setShowModal(false)
    setEditing(null)
    await loadDocumentos()
    setLoadingAction(false)

    setForm({
      especie_documental: "",
      data_limite: "",
      quantidade_caixas: 1,
      observacao: "",
    })
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setLoadingAction(true)

    const { error } = await supabase.from("documentos_adm").delete().eq("id", deleteId)
    if (error) {
      console.error(error)
      showToast("Erro ao excluir documento", "error")
    } else {
      showToast("Documento excluído com sucesso!", "success")
      await loadDocumentos()
    }

    setShowConfirm(false)
    setDeleteId(null)
    setLoadingAction(false)
  }

  const handleEdit = (doc: DocumentoAdm) => {
    setEditing(doc)
    setForm({
      especie_documental: doc.especie_documental,
      data_limite: doc.data_limite ?? "",
      quantidade_caixas: doc.quantidade_caixas ?? 1,
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
      observacao: "",
    })
    setShowModal(true)
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <GlobalLoader visible={loadingAction} />

      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-indigo-700">📄 Documentos Administrativos</h2>
        <div className="flex gap-2">
          <button
            onClick={openCreateModal}
            className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 flex items-center justify-center cursor-pointer"
          >
            <span className="mr-3 text-sm font-semibold">Novo Documento</span>
            <DocumentTextIcon className="h-6 w-6" />
          </button>

          {/* Botão e Modal de Etiqueta */}
          <>
            <button
              onClick={() => {
                const url = `/etiquetas/${caixaId}?tipo=documento_administrativo`
                setEtiquetaUrl(url)
                setShowEtiqueta(true)
              }}
              disabled={loadingEtiqueta}
              className={`p-3 rounded-lg border flex items-center justify-center cursor-pointer transition ${
                loadingEtiqueta
                  ? "bg-indigo-200 border-indigo-300 opacity-70 cursor-not-allowed"
                  : "bg-indigo-50 border-indigo-200 hover:bg-indigo-100"
              }`}
            >
              {loadingEtiqueta ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-gray-700 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"
                    ></path>
                  </svg>
                  <span className="text-sm font-semibold">Abrindo...</span>
                </>
              ) : (
                <>
                  <span className="mr-3 text-sm font-semibold">Etiqueta</span>
                  <PrinterIcon className="h-6 w-6 text-gray-700" />
                </>
              )}
            </button>

            {showEtiqueta && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl shadow-lg w-[90%] max-w-5xl h-[90vh] overflow-hidden flex flex-col">
                  <div className="flex justify-between items-center bg-indigo-600 text-white px-4 py-2">
                    <h2 className="text-sm font-semibold">Visualização da Etiqueta</h2>
                    <button
                      onClick={() => setShowEtiqueta(false)}
                      className="text-white hover:text-gray-200 text-sm cursor-pointer flex items-center gap-1"
                    >
                      ✕ <span>Fechar</span>
                    </button>
                  </div>
                  <iframe src={etiquetaUrl} className="flex-1 w-full border-0" title="Etiqueta"></iframe>
                </div>
              </div>
            )}
          </>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-gray-50 rounded-2xl shadow p-2">
        <table className="w-full text-sm border-separate border-spacing-y-1">
          <thead>
            <tr className="bg-gray-100 text-gray-700 font-medium">
              <th className="px-4 py-3 text-left">Espécie Documental</th>
              <th className="px-4 py-3 text-left">Ano Limite</th>
              <th className="px-4 py-3 text-left">Qtd. Caixas</th>
              <th className="px-4 py-3 text-left">Nº Caixa</th>
              <th className="px-4 py-3 text-left">Observação</th>
              <th className="px-4 py-3 text-right">Operações</th>
            </tr>
          </thead>
          {loadingList ? (
            <SkeletonTable rows={5} />
          ) : (
            <tbody>
              {documentos.length ? (
                documentos.map((d) => (
                  <tr key={d.id} className="bg-white hover:bg-gray-50">
                    <td className="px-4 py-3">{d.especie_documental}</td>
                    <td className="px-4 py-3">{d.data_limite}</td>
                    <td className="px-4 py-3">{d.quantidade_caixas}</td>
                    <td className="px-4 py-3">{d.numero_caixas ?? "—"}</td>
                    <td className="px-4 py-3">{d.observacao ?? "—"}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => handleEdit(d)} className="text-yellow-600 hover:underline cursor-pointer">
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

      {/* Modal Cadastro/Edição */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-indigo-700">
                {editing ? "Editar Documento" : "Cadastrar Documento"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 cursor-pointer">
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
                    onChange={(e) => setForm({ ...form, quantidade_caixas: safeInt(e.target.value, 1) })}
                    className={inputClass}
                  />
                </div>
                {/* Número da Caixa (read-only) */}
                <div>
                  <label className="block text-xs mb-1 text-gray-700">Número da Caixa</label>
                  <input
                    type="text"
                    value={numeroCaixa || ""}
                    readOnly
                    className="w-full border border-gray-200 rounded-md p-2 text-sm bg-gray-50 text-gray-600 cursor-not-allowed"
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
                  className="p-3 rounded-lg bg-indigo-100 border border-indigo-300 hover:bg-indigo-200 flex items-center justify-center cursor-pointer"
                >
                  <span className="mr-2 text-sm">
                    {editing ? "Salvar Alterações" : "Salvar Documento"}
                  </span>
                  <CheckIcon className="h-4 w-4 text-gray-700" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmação + Senha */}
      {showConfirm && (
        <ConfirmPasswordModal
          open={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}
