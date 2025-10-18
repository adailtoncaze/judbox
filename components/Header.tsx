"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import Image from "next/image"
import {
  ArrowLeftCircleIcon,
  HomeIcon,
  ArrowDownTrayIcon,
  ChevronDownIcon,
  ScaleIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  EyeIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline"
import { useToast } from "@/hooks/useToast"
import PdfPreviewModal from "@/components/PdfPreviewModal"

export default function Header() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const [email, setEmail] = useState<string | null>(null)

  // dropdowns
  const [openCsv, setOpenCsv] = useState(false)
  const [openPdf, setOpenPdf] = useState(false)

  // modal
  const [previewOpen, setPreviewOpen] = useState(false)

  // loading CSV
  const [loading, setLoading] = useState<string | null>(null)

  // loading PDF (novo): 'preview' | 'download' | null
  const [loadingPdf, setLoadingPdf] = useState<"preview" | "download" | null>(null)

  const csvDropdownRef = useRef<HTMLDivElement>(null)
  const pdfDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
  }, [])

  // fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (csvDropdownRef.current && !csvDropdownRef.current.contains(target)) setOpenCsv(false)
      if (pdfDropdownRef.current && !pdfDropdownRef.current.contains(target)) setOpenPdf(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    router.replace("/login")
  }

  // Baixa o CSV garantindo extensão e nome corretos
  async function downloadCsv(kind: "documentos_adm" | "processos_jud" | "processos_adm") {
    const res = await fetch(`/api/export/csv?tipo=${kind}`, { method: "GET" })
    if (!res.ok) {
      const msg = await res.text().catch(() => "")
      throw new Error(msg || "Falha ao gerar CSV.")
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${kind}.csv` // força a extensão e o nome
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  // Mapeia os três botões para a nova rota
  const handleExport = async (type: "docs" | "jud" | "adm") => {
    try {
      setLoading(type)
      if (type === "docs") await downloadCsv("documentos_adm")
      if (type === "jud") await downloadCsv("processos_jud")
      if (type === "adm") await downloadCsv("processos_adm")
      showToast("CSV gerado com sucesso.", "success")
    } catch (e: any) {
      showToast(e?.message || "Falha ao iniciar download do CSV.", "error")
    } finally {
      setLoading(null)
      setOpenCsv(false)
    }
  }

  // filtros atuais (se quiser passar depois à rota)
  const tipoAtual = (searchParams.get("tipo") ?? "todos").toString()
  const numeroAtual = (searchParams.get("numero") ?? "").toString()

  // PDF: abrir modal com spinner enquanto inicia
  const abrirPreviewModal = () => {
    setLoadingPdf("preview")
    setPreviewOpen(true)
    setOpenPdf(false)
    setTimeout(() => setLoadingPdf(null), 300)
  }

  const baixarPDF = async () => {
    try {
      setLoadingPdf("download")
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: tipoAtual || "todos", numero: numeroAtual || "" }),
      })
      if (!res.ok) {
        const msg = await res.text().catch(() => "")
        if (res.status === 401) {
          router.push("/login")
          return
        }
        throw new Error(msg || "Falha ao gerar PDF.")
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "judbox-relatorio.pdf"
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro inesperado ao gerar PDF.")
    } finally {
      setLoadingPdf(null)
      setOpenPdf(false)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow">
        <div className="max-w-6xl mx-auto px-4">
          <div className="h-14 flex items-center justify-between">
            {/* Esquerda: navegação */}
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <Image src="/logo.svg" alt="JudBox Logo" width={45} height={45} priority />
                <span className="text-lg font-bold text-white">JudBox</span>
              </Link>

              <Link
                href="/"
                className="hidden sm:inline-flex items-center gap-2 text-sm font-medium bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition"
              >
                <HomeIcon className="h-5 w-5 text-white/90" />
                <span>Dashboard</span>
              </Link>

              {/* Exportar CSV */}
              <div className="relative" ref={csvDropdownRef}>
                <button
                  onClick={() => { setOpenCsv(v => !v); setOpenPdf(false) }}
                  className="hidden sm:inline-flex items-center gap-2 text-sm font-medium bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition cursor-pointer"
                >
                  <ArrowDownTrayIcon className="h-5 w-5 text-white/90" />
                  <span>Exportar CSV</span>
                  <ChevronDownIcon className="h-4 w-4 text-white/80" />
                </button>

                <div
                  className={`absolute left-0 mt-2 w-72 bg-white text-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50 transform transition-all duration-200 ease-out ${
                    openCsv ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                  }`}
                >
                  <div className="py-1">
                    {/* Processos Judiciais */}
                    <button
                      onClick={() => handleExport("jud")}
                      disabled={loading === "jud"}
                      className="w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-100 disabled:opacity-50 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <ScaleIcon className="h-5 w-5 text-indigo-600" />
                        <span>Processos Judiciais</span>
                      </div>
                      {loading === "jud" && (
                        <span className="animate-spin border-2 border-indigo-600 border-t-transparent rounded-full w-4 h-4"></span>
                      )}
                    </button>

                    {/* Processos Administrativos */}
                    <button
                      onClick={() => handleExport("adm")}
                      disabled={loading === "adm"}
                      className="w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-100 disabled:opacity-50 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <ClipboardDocumentListIcon className="h-5 w-5 text-indigo-600" />
                        <span>Processos Administrativos</span>
                      </div>
                      {loading === "adm" && (
                        <span className="animate-spin border-2 border-indigo-600 border-t-transparent rounded-full w-4 h-4"></span>
                      )}
                    </button>

                    {/* Documentos Administrativos */}
                    <button
                      onClick={() => handleExport("docs")}
                      disabled={loading === "docs"}
                      className="w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-100 disabled:opacity-50 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <DocumentTextIcon className="h-5 w-5 text-indigo-600" />
                        <span>Documentos Administrativos</span>
                      </div>
                      {loading === "docs" && (
                        <span className="animate-spin border-2 border-indigo-600 border-t-transparent rounded-full w-4 h-4"></span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Relatório PDF */}
              <div className="relative" ref={pdfDropdownRef}>
                <button
                  onClick={() => { setOpenPdf(v => !v); setOpenCsv(false) }}
                  className="hidden sm:inline-flex items-center gap-2 text-sm font-medium bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition cursor-pointer"
                >
                  <DocumentArrowDownIcon className="h-5 w-5 text-white/90" />
                  <span>Relatório PDF</span>
                  <ChevronDownIcon className="h-4 w-4 text-white/80" />
                </button>

                <div
                  className={`absolute left-0 mt-2 w-72 bg-white text-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50 transform transition-all duration-200 ease-out ${
                    openPdf ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                  }`}
                >
                  <div className="py-1">
                    {/* Pré-visualização (modal) */}
                    <button
                      onClick={abrirPreviewModal}
                      disabled={loadingPdf === "preview"}
                      className="w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-100 disabled:opacity-50 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <EyeIcon className="h-5 w-5 text-indigo-600" />
                        <span>Pré-visualizar</span>
                      </div>
                      {loadingPdf === "preview" && (
                        <span className="animate-spin border-2 border-indigo-600 border-t-transparent rounded-full w-4 h-4"></span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Direita: email + sair */}
            <div className="flex items-center gap-3">
              {email && (
                <span className="hidden sm:inline text-sm font-medium text-indigo-100 bg-white/10 px-3 py-1 rounded-full">
                  {email}
                </span>
              )}

              <button
                onClick={logout}
                className="flex items-center gap-2 text-sm font-medium text-indigo-600 bg-white hover:bg-indigo-50 px-3 py-1.5 rounded-lg shadow-sm transition cursor-pointer"
              >
                <ArrowLeftCircleIcon className="h-5 w-5 text-indigo-600" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Modal de pré-visualização */}
      <PdfPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        tipo={tipoAtual}
        numero={numeroAtual}
      />
    </>
  )
}
