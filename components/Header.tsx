"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
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
} from "@heroicons/react/24/outline"
import { exportDocsAdm, exportProcJud, exportProcAdm } from "./exportCsv"
import { useToast } from "@/hooks/useToast"

export default function Header() {
  const router = useRouter()
  const { showToast } = useToast()
  const [email, setEmail] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
  }, [])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    router.replace("/login")
  }

  const handleExport = async (type: "docs" | "jud" | "adm") => {
    try {
      setLoading(type)
      if (type === "docs") await exportDocsAdm(showToast)
      if (type === "jud") await exportProcJud(showToast)
      if (type === "adm") await exportProcAdm(showToast)
    } finally {
      setLoading(null)
      setOpen(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow">
      <div className="max-w-6xl mx-auto px-4">
        <div className="h-14 flex items-center justify-between">
          {/* Logo + botões de navegação */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.svg"
                alt="JudBox Logo"
                width={45}
                height={45}
                priority
              />
              <span className="text-lg font-bold text-white">JudBox</span>
            </Link>

            {/* Botão Dashboard */}
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-2 text-sm font-medium bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition"
            >
              <HomeIcon className="h-5 w-5 text-white/90" />
              <span>Dashboard</span>
            </Link>

            {/* Dropdown Exportar CSV */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setOpen(!open)}
                className="hidden sm:inline-flex items-center gap-2 text-sm font-medium bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition cursor-pointer"
              >
                <ArrowDownTrayIcon className="h-5 w-5 text-white/90" />
                <span>Exportar CSV</span>
                <ChevronDownIcon className="h-4 w-4 text-white/80" />
              </button>

              <div
                className={`absolute left-0 mt-2 w-72 bg-white text-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50 transform transition-all duration-200 ease-out ${
                  open
                    ? "opacity-100 scale-100 translate-y-0"
                    : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
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
          </div>

          {/* Email + Logout */}
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
  )
}
