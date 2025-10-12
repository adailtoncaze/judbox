"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import AuthGuard from "@/components/AuthGuard"
import Header from "@/components/Header"
import { useToast } from "@/hooks/useToast"
import {
  SquaresPlusIcon,
  CheckIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline"
import GlobalLoader from "@/components/GlobalLoader"
import { SkeletonTable } from "@/components/SkeletonTable"
import ConfirmPasswordModal from "@/components/ConfirmPasswordModal"

type Caixa = {
  id: string
  numero_caixa: string | null
  tipo:
  | "processo_administrativo"
  | "processo_judicial"
  | "documento_administrativo"
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
  const [loadingList, setLoadingList] = useState(true)
  const [loadingAction, setLoadingAction] = useState(false)
  const [loadingCaixaId, setLoadingCaixaId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  // Paginação
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 10

  // Filtros
  const [filterNumero, setFilterNumero] = useState("")
  const [filterTipo, setFilterTipo] = useState("")

  // Contadores
  const [countProc, setCountProc] = useState<Record<string, number>>({})
  const [countDoc, setCountDoc] = useState<Record<string, number>>({})

  // Modal
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Caixa | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [loadingSearch, setLoadingSearch] = useState(false)


  const inputClass =
    "w-full border border-gray-200 rounded-md px-3 py-1.5 text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"

  const [form, setForm] = useState({
    numero_caixa: "",
    tipo: "" as Caixa["tipo"] | "",
    descricao: "",
    localizacao: "Guarabira",
    destinacao: "preservar" as "preservar" | "eliminar",
  })

  // 🔄 Carregar caixas (com filtro e paginação)
  async function loadCaixas() {
    setLoadingList(true)
    const start = (page - 1) * pageSize
    const end = start + pageSize - 1

    try {
      let query = supabase
        .from("caixas")
        .select("*", { count: "exact" })
        .order("data_criacao", { ascending: false })
        .range(start, end)

      if (filterNumero.trim()) {
        query = query.ilike("numero_caixa", `%${filterNumero.trim()}%`)
      }
      if (filterTipo) {
        query = query.eq("tipo", filterTipo)
      }

      const { data, error, count } = await query
      if (error) throw error

      const lista = data || []
      setCaixas(lista)
      setTotal(count || 0)

      const ids = lista.map((c) => c.id).filter(Boolean)
      if (ids.length) {
        const [procRes, docRes] = await Promise.all([
          supabase.from("processos").select("caixa_id").in("caixa_id", ids),
          supabase.from("documentos_adm").select("caixa_id").in("caixa_id", ids),
        ])

        const procMap: Record<string, number> = {}
        const docMap: Record<string, number> = {}

        if (procRes.data) {
          for (const r of procRes.data as { caixa_id: string }[]) {
            procMap[r.caixa_id] = (procMap[r.caixa_id] || 0) + 1
          }
        }
        if (docRes.data) {
          for (const r of docRes.data as { caixa_id: string }[]) {
            docMap[r.caixa_id] = (docMap[r.caixa_id] || 0) + 1
          }
        }

        setCountProc(procMap)
        setCountDoc(docMap)
      } else {
        setCountProc({})
        setCountDoc({})
      }
    } catch (err) {
      console.error(err)
      showToast("Erro ao carregar caixas", "error")
    } finally {
      setLoadingList(false)
    }
  }

  const handleSearch = async () => {
    setLoadingSearch(true);
    setPage(1);

    if (filterNumero.trim() === "") {
      // só limpa e deixa o useEffect cuidar do recarregamento
      setFilterTipo("");
      setLoadingSearch(false);
      return;
    }

    let query = supabase
      .from("caixas")
      .select("*", { count: "exact" })
      .ilike("numero_caixa", `%${filterNumero.trim()}%`)
      .order("data_criacao", { ascending: false })
      .range(0, pageSize - 1);

    if (filterTipo !== "") {
      query = query.eq("tipo", filterTipo);
    }

    const { data, error, count } = await query;

    if (error) {
      showToast("Erro ao buscar caixas", "error");
    } else {
      const lista = data || [];
      setCaixas(lista);
      setTotal(count || 0);

      // 🔄 Recalcula contadores como no loadCaixas()
      const ids = lista.map((c) => c.id).filter(Boolean);
      if (ids.length) {
        const [procRes, docRes] = await Promise.all([
          supabase.from("processos").select("caixa_id").in("caixa_id", ids),
          supabase.from("documentos_adm").select("caixa_id").in("caixa_id", ids),
        ]);

        const procMap: Record<string, number> = {};
        const docMap: Record<string, number> = {};

        if (procRes.data) {
          for (const r of procRes.data as { caixa_id: string }[]) {
            procMap[r.caixa_id] = (procMap[r.caixa_id] || 0) + 1;
          }
        }
        if (docRes.data) {
          for (const r of docRes.data as { caixa_id: string }[]) {
            docMap[r.caixa_id] = (docMap[r.caixa_id] || 0) + 1;
          }
        }

        setCountProc(procMap);
        setCountDoc(docMap);
      } else {
        setCountProc({});
        setCountDoc({});
      }
    }

    setLoadingSearch(false);
  };


  // 🔁 Quando o campo busca for apagado, reseta tipo e recarrega tudo
  useEffect(() => {
    if (filterNumero.trim() === "") {
      // ⚙️ reseta o tipo para "" (Todos)
      setFilterTipo("");

      // ✅ usa async callback para garantir que o estado foi atualizado antes de recarregar
      const reload = async () => {
        await new Promise((resolve) => setTimeout(resolve, 0)); // garante flush do estado
        await loadCaixas();
      };
      reload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterNumero]);

  useEffect(() => {
    loadCaixas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterTipo])

  // Bloquear scroll em modais
  useEffect(() => {
    document.body.style.overflow = showModal || showConfirm ? "hidden" : ""
  }, [showModal, showConfirm])

  // Fechar dropdown externo
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest(".dropdown-menu") && !target.closest(".dropdown-trigger")) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [])

  // Funções do modal (mantém editar funcional)
  const openCreateModal = () => {
    setEditing(null)
    setForm({
      numero_caixa: "",
      tipo: "",
      descricao: "",
      localizacao: "Guarabira",
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
      localizacao: c.localizacao || "Guarabira",
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

    setLoadingAction(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      showToast("Usuário não autenticado", "error")
      setLoadingAction(false)
      return
    }

    const cidade = form.localizacao?.trim() || "Guarabira"

    try {
      if (editing) {
        const temVinculo =
          (countProc[editing.id] ?? 0) > 0 || (countDoc[editing.id] ?? 0) > 0

        const payloadUpdate: Record<string, any> = {
          descricao: form.descricao?.trim() || null,
          localizacao: cidade,
          destinacao: form.destinacao,
        }

        const novoNumero = form.numero_caixa?.trim() || null
        const numeroAtual = editing.numero_caixa || null
        if (novoNumero !== numeroAtual) {
          payloadUpdate.numero_caixa = novoNumero
        }

        if (!temVinculo) {
          payloadUpdate.tipo = form.tipo as Caixa["tipo"]
        } else if (form.tipo !== editing.tipo) {
          showToast(
            "O tipo da caixa permaneceu inalterado pois há processos/documentos vinculados.",
            "info"
          )
        }

        const { data, error } = await supabase
          .from("caixas")
          .update(payloadUpdate)
          .eq("id", editing.id)
          .eq("user_id", user.id)
          .select("id")

        if (error || !data?.length) {
          showToast("Erro ao salvar caixa", "error")
        } else {
          showToast("Caixa atualizada com sucesso!", "success")
          setShowModal(false)
          await loadCaixas()
        }
      } else {
        const payloadInsert = {
          numero_caixa: form.numero_caixa?.trim() || null,
          tipo: form.tipo as Caixa["tipo"],
          descricao: form.descricao?.trim() || null,
          localizacao: cidade,
          destinacao: form.destinacao,
          user_id: user.id,
        }

        const { error } = await supabase.from("caixas").insert([payloadInsert])
        if (error) throw error
        showToast("Caixa cadastrada com sucesso!", "success")
        setShowModal(false)
        await loadCaixas()
      }
    } catch (err) {
      console.error(err)
      showToast("Erro inesperado ao salvar caixa", "error")
    } finally {
      setLoadingAction(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setLoadingAction(true)
    const { error } = await supabase.from("caixas").delete().eq("id", deleteId)
    if (error) showToast("Erro ao excluir caixa", "error")
    else {
      showToast("Caixa excluída!", "success")
      await loadCaixas()
    }
    setShowConfirm(false)
    setDeleteId(null)
    setLoadingAction(false)
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <AuthGuard>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-2 space-y-2">
        <GlobalLoader visible={loadingAction} />

        {/* Cabeçalho */}
        <div className="flex justify-between items-center py-4 space-y-4">
          <h1 className="text-2xl font-bold text-indigo-700">📦 Caixas</h1>
          <button
            onClick={openCreateModal}
            className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 flex items-center justify-center cursor-pointer"
          >
            <span className="mr-3 text-sm font-semibold">Nova Caixa</span>
            <SquaresPlusIcon className="h-6 w-6 text-gray-700" />
          </button>
        </div>

        {/* 🔍 Card de Busca */}
        <div className="bg-gray-50 rounded shadow p-4 flex flex-wrap items-center gap-3">
          <input
            type="number"
            placeholder="Buscar número da caixa..."
            value={filterNumero}
            onChange={(e) => setFilterNumero(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            autoComplete="off" // 👈 impede autofill
            inputMode="numeric" // 👈 reforça o modo numérico
            className="flex-1 min-w-[200px] bg-white border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="w-48 border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-1 outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Todos os tipos</option>
            <option value="processo_judicial">Processo Judicial</option>
            <option value="processo_administrativo">
              Processo Administrativo
            </option>
            <option value="documento_administrativo">
              Documento Administrativo
            </option>
          </select>
          <button
            onClick={handleSearch}
            disabled={loadingSearch}
            className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-medium transition cursor-pointer ${loadingSearch
              ? "bg-indigo-400 cursor-not-allowed text-white"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
          >
            {loadingSearch ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
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
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"
                  />
                </svg>
                <span>Buscando...</span>
              </>
            ) : (
              <>
                <MagnifyingGlassIcon className="h-4 w-4" />
                Buscar
              </>
            )}
          </button>

        </div>

        {/* Tabela */}
        <div className="bg-gray-50 rounded shadow p-2">
          <table className="w-full text-sm border-separate border-spacing-y-1">
            <thead>
              <tr className="bg-gray-100 text-gray-700 font-medium">
                <th className="px-4 py-3 text-left">Número</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Cidade</th>
                <th className="px-4 py-3 text-left">Destinação</th>
                <th className="px-4 py-3 text-left">Observação</th>
                <th className="px-4 py-3 text-left">Itens</th>
                <th className="px-4 py-3 text-right">Operações</th>
              </tr>
            </thead>

            {loadingList ? (
              <SkeletonTable rows={5} />
            ) : (
              <tbody>
                {caixas.length ? (
                  caixas.map((c) => {
                    const qtd =
                      c.tipo === "documento_administrativo"
                        ? countDoc[c.id] ?? 0
                        : countProc[c.id] ?? 0
                    const badgeClass =
                      qtd >= 20
                        ? "bg-red-100 text-red-700 ring-1 ring-red-300"
                        : "bg-indigo-100 text-indigo-700"

                    return (
                      <tr key={c.id} className="bg-white hover:bg-gray-50">
                        <td className="px-4 py-2 bg-indigo-50 font-semibold text-center">
                          Caixa {c.numero_caixa}
                        </td>
                        <td className="px-4 py-2">{formatTipoCaixa(c.tipo)}</td>
                        <td className="px-4 py-2">{c.localizacao || "Guarabira"}</td>
                        <td className="px-4 py-2 capitalize">
                          {c.destinacao === "preservar" ? "Preservar" : "Eliminar"}
                        </td>
                        <td className="px-4 py-2 truncate">{c.descricao || "—"}</td>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}
                          >
                            {qtd}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right">
                          {/* Botão Abrir */}
                          <button
                            onClick={async () => {
                              setLoadingAction(true)
                              try {
                                setLoadingCaixaId(c.id)
                                await new Promise((res) => setTimeout(res, 800))
                                window.location.href = `/caixas/${c.id}`
                              } finally {
                                setLoadingCaixaId(null)
                                setLoadingAction(false)
                              }
                            }}
                            disabled={loadingCaixaId === c.id}
                            className={`inline-flex items-center justify-center px-3 py-1.5 text-sm rounded-md mr-2 cursor-pointer ${loadingCaixaId === c.id
                              ? "bg-indigo-400 cursor-not-allowed"
                              : "bg-indigo-600 hover:bg-indigo-700 text-white"
                              }`}
                          >
                            {loadingCaixaId === c.id ? (
                              <>
                                <svg
                                  className="animate-spin h-4 w-4 text-white mr-2"
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
                                Abrindo...
                              </>
                            ) : (
                              <>Abrir</>
                            )}
                          </button>

                          {/* Dropdown */}
                          <div className="relative inline-block text-left">
                            <button
                              className="dropdown-trigger p-2 rounded-full hover:bg-gray-100 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation()
                                setOpenMenuId(openMenuId === c.id ? null : c.id)
                              }}
                            >
                              ⋮
                            </button>
                            {openMenuId === c.id && (
                              <div className="dropdown-menu absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                <button
                                  onClick={() => {
                                    handleEdit(c)
                                    setOpenMenuId(null)
                                  }}
                                  className="block w-full text-left px-4 py-2 text-sm text-yellow-600 hover:bg-gray-50 cursor-pointer"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => {
                                    setDeleteId(c.id)
                                    setShowConfirm(true)
                                    setOpenMenuId(null)
                                  }}
                                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 cursor-pointer"
                                >
                                  Excluir
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-gray-500 italic"
                    >
                      Nenhuma caixa cadastrada
                    </td>
                  </tr>
                )}
              </tbody>
            )}
          </table>
        </div>

        {/* Paginação completa */}
        {totalPages > 1 && (
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 mt-4 text-sm text-gray-600">
            <span>Total de registros: {total}</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(1)}
                className="px-3 py-1 rounded-md border disabled:opacity-50 cursor-pointer"
              >
                ⏮ Primeira
              </button>
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-md border disabled:opacity-50 cursor-pointer"
              >
                ← Anterior
              </button>
              <span className="mx-2">
                Página {page} de {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 rounded-md border disabled:opacity-50 cursor-pointer"
              >
                Próxima →
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(totalPages)}
                className="px-3 py-1 rounded-md border disabled:opacity-50 cursor-pointer"
              >
                Última ⏭
              </button>
            </div>
          </div>
        )}

        {/* Modal Cadastro/Edição */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
            <div className="bg-white rounded shadow-lg p-6 w-full max-w-lg">
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
                  <label className="block text-xs mb-1 text-gray-700">
                    Número da Caixa
                  </label>
                  <input
                    type="text"
                    value={form.numero_caixa}
                    onChange={(e) =>
                      setForm({ ...form, numero_caixa: e.target.value })
                    }
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs mb-1 text-gray-700">Tipo</label>
                  <select
                    value={form.tipo}
                    onChange={(e) =>
                      setForm({ ...form, tipo: e.target.value as Caixa["tipo"] })
                    }
                    className={inputClass}
                    required
                  >
                    <option value="">Selecione</option>
                    <option value="processo_judicial">Processo Judicial</option>
                    <option value="processo_administrativo">
                      Processo Administrativo
                    </option>
                    <option value="documento_administrativo">
                      Documento Administrativo
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs mb-1 text-gray-700">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={form.localizacao}
                    onChange={(e) =>
                      setForm({ ...form, localizacao: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs mb-1 text-gray-700">
                    Destinação
                  </label>
                  <select
                    value={form.destinacao}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        destinacao: e.target.value as "preservar" | "eliminar",
                      })
                    }
                    className={inputClass}
                  >
                    <option value="preservar">Preservar</option>
                    <option value="eliminar">Eliminar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs mb-1 text-gray-700">
                    Observação
                  </label>
                  <textarea
                    value={form.descricao}
                    onChange={(e) =>
                      setForm({ ...form, descricao: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="p-3 rounded-lg bg-indigo-100 border border-indigo-300 hover:bg-indigo-200 flex items-center justify-center cursor-pointer"
                  >
                    <span className="mr-2 text-sm">
                      {editing ? "Salvar Alterações" : "Salvar Caixa"}
                    </span>
                    <CheckIcon className="h-4 w-4 text-gray-700" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirmação */}
        {showConfirm && (
          <ConfirmPasswordModal
            open={showConfirm}
            onClose={() => setShowConfirm(false)}
            onConfirm={handleDelete}
          />
        )}
      </main>
    </AuthGuard>
  )
}
