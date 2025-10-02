"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import AuthGuard from "@/components/AuthGuard"
import Header from "@/components/Header"
import { useToast } from "@/hooks/useToast"

type Caixa = {
  id: string
  numero_caixa: string | null
  tipo: "processo_administrativo" | "processo_judicial" | "documento_administrativo"
  descricao?: string | null
  localizacao?: string | null
  destinacao?: "preservar" | "eliminar"
  user_id?: string
}

const formatTipoCaixa = (v: Caixa["tipo"]) =>
  v === "processo_judicial"
    ? "Processo Judicial"
    : v === "processo_administrativo"
    ? "Processo Administrativo"
    : "Documento Administrativo"

export default function CaixasPage() {
  const { showToast } = useToast()
  const [caixas, setCaixas] = useState<Caixa[]>([])
  const [loading, setLoading] = useState(true)

  // Paginação
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 10

  // Modal
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Caixa | null>(null)

  // Confirmação
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Formulário
  const [form, setForm] = useState({
    numero_caixa: "",
    tipo: "" as Caixa["tipo"] | "",
    descricao: "",
    localizacao: "",
    destinacao: "preservar" as "preservar" | "eliminar", // novo campo
  })

  const inputClass =
    "w-full border border-gray-200 rounded-md px-3 py-1.5 text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"

  async function loadCaixas() {
    setLoading(true)

    const start = (page - 1) * pageSize
    const end = start + pageSize - 1

    const { data, error, count } = await supabase
      .from("caixas")
      .select("*", { count: "exact" })
      .order("numero_caixa", { ascending: true })
      .range(start, end)

    if (error) {
      showToast("Erro ao carregar caixas", "error")
      setCaixas([])
    } else {
      setCaixas(data || [])
      setTotal(count || 0)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadCaixas()
  }, [page])

  const openCreateModal = () => {
    setEditing(null)
    setForm({
      numero_caixa: "",
      tipo: "",
      descricao: "",
      localizacao: "",
      destinacao: "preservar",
    })
    setShowModal(true)
  }

  const handleEdit = (c: Caixa) => {
    setEditing(c)
    setForm({
      numero_caixa: c.numero_caixa || "",
      tipo: c.tipo,
      descricao: c.descricao || "",
      localizacao: c.localizacao || "",
      destinacao: c.destinacao || "preservar",
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.tipo) {
      showToast("Selecione o tipo da caixa", "error")
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      showToast("Usuário não autenticado", "error")
      return
    }

    const payload = {
      numero_caixa: form.numero_caixa?.trim() || null,
      tipo: form.tipo as Caixa["tipo"],
      descricao: form.descricao?.trim() || null,
      localizacao: form.localizacao?.trim() || null,
      destinacao: form.destinacao, // novo campo
      user_id: user.id,
    }

    if (editing) {
      const { error } = await supabase.from("caixas").update(payload).eq("id", editing.id)
      if (error) {
        showToast("Erro ao atualizar caixa", "error")
      } else {
        showToast("Caixa atualizada com sucesso!", "success")
        setShowModal(false)
        await loadCaixas()
      }
    } else {
      const { error } = await supabase.from("caixas").insert([payload])
      if (error) {
        showToast("Erro ao salvar caixa", "error")
      } else {
        showToast("Caixa cadastrada com sucesso!", "success")
        setShowModal(false)
        await loadCaixas()
      }
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const { error } = await supabase.from("caixas").delete().eq("id", deleteId)

    if (error) {
      showToast("Erro ao excluir caixa", "error")
    } else {
      showToast("Caixa excluída!", "success")
      await loadCaixas()
    }
    setShowConfirm(false)
    setDeleteId(null)
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <AuthGuard>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-700">📦 Caixas</h1>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow text-sm cursor-pointer"
          >
            + Nova Caixa
          </button>
        </div>

        {/* Tabela */}
        <div className="bg-gray-50 rounded-2xl shadow p-2">
          <table className="w-full text-sm border-separate border-spacing-y-1">
            <thead>
              <tr className="bg-gray-100 text-gray-700 font-medium">
                <th className="px-4 py-3 text-left">Número</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Cidade</th>
                <th className="px-4 py-3 text-left">Destinação</th>
                <th className="px-4 py-3 text-left">Observação</th>
                <th className="px-4 py-3 text-right">Operações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="bg-white">
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    Carregando...
                  </td>
                </tr>
              ) : caixas.length ? (
                caixas.map((c) => (
                  <tr key={c.id} className="bg-white hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold">Caixa {c.numero_caixa}</td>
                    <td className="px-4 py-3">{formatTipoCaixa(c.tipo)}</td>
                    <td className="px-4 py-3">{c.localizacao || "—"}</td>
                    <td className="px-4 py-3 capitalize">
                      {c.destinacao === "preservar"
                        ? "Preservar"
                        : c.destinacao === "eliminar"
                        ? "Eliminar"
                        : "—"}
                    </td>
                    <td className="px-4 py-3 truncate">{c.descricao || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      {/* Botão Abrir */}
                      <Link
                        href={`/caixas/${c.id}`}
                        className="inline-block px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-md cursor-pointer mr-2"
                      >
                        Abrir
                      </Link>

                      {/* Menu suspenso */}
                      <div className="relative inline-block text-left">
                        <button
                          className="p-2 rounded-full hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            const el = document.getElementById(`menu-${c.id}`)
                            if (el) el.classList.toggle("hidden")
                          }}
                        >
                          ⋮
                        </button>
                        <div
                          id={`menu-${c.id}`}
                          className="hidden absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                        >
                          <button
                            onClick={() => {
                              handleEdit(c)
                              document.getElementById(`menu-${c.id}`)?.classList.add("hidden")
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-yellow-600 hover:bg-gray-50 cursor-pointer"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => {
                              setDeleteId(c.id)
                              setShowConfirm(true)
                              document.getElementById(`menu-${c.id}`)?.classList.add("hidden")
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 cursor-pointer"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="bg-white">
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500 italic">
                    Nenhuma caixa cadastrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-4">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 rounded-md border disabled:opacity-50 cursor-pointer"
            >
              ← Anterior
            </button>
            <span className="text-sm text-gray-600">
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

        {/* Modal Caixa */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
            <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-lg">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-indigo-700">
                  {editing ? "Editar Caixa" : "Cadastrar Caixa"}
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
                  <label className="block text-xs mb-1 text-gray-700">Número da Caixa</label>
                  <input
                    type="text"
                    value={form.numero_caixa}
                    onChange={(e) => setForm({ ...form, numero_caixa: e.target.value })}
                    className={inputClass}
                    required
                  />
                </div>
                {/* Novo campo Destinação */}
                <div>
                  <label className="block text-xs mb-1 text-gray-700">Destinação</label>
                  <select
                    value={form.destinacao}
                    onChange={(e) =>
                      setForm({ ...form, destinacao: e.target.value as "preservar" | "eliminar" })
                    }
                    className={inputClass}
                  >
                    <option value="preservar">Preservar</option>
                    <option value="eliminar">Eliminar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs mb-1 text-gray-700">Tipo</label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value as Caixa["tipo"] })}
                    className={inputClass}
                    required
                  >
                    <option value="">Selecione</option>
                    <option value="processo_judicial">Processo Judicial</option>
                    <option value="processo_administrativo">Processo Administrativo</option>
                    <option value="documento_administrativo">Documento Administrativo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs mb-1 text-gray-700">Cidade</label>
                  <input
                    type="text"
                    value={form.localizacao}
                    onChange={(e) => setForm({ ...form, localizacao: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs mb-1 text-gray-700">Observação</label>
                  <textarea
                    value={form.descricao}
                    onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow text-sm cursor-pointer"
                  >
                    {editing ? "Salvar Alterações" : "Salvar Caixa"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Confirmação */}
        {showConfirm && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
            <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm text-center">
              <h2 className="text-lg font-semibold mb-4">Confirmar exclusão</h2>
              <p className="text-sm mb-6">Excluir esta caixa?</p>
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
