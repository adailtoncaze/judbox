"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowDownTrayIcon, ChevronDownIcon } from "@heroicons/react/24/outline"
import { exportDocsAdm, exportProcJud, exportProcAdm } from "./exportCsv"
import { useToast } from "@/hooks/useToast"

export default function ExportDropdown() {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { showToast } = useToast()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Função auxiliar para tratar erros de exportação
  const handleExport = async (fn: () => Promise<void>) => {
    try {
      await fn()
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message)
      } else {
        alert("Erro inesperado ao exportar.")
      }
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="hidden sm:inline-flex items-center gap-2 text-sm font-medium bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition"
      >
        <ArrowDownTrayIcon className="h-5 w-5 text-white/90" />
        <span>Exportar CSV</span>
        <ChevronDownIcon className="h-4 w-4 text-white/80" />
      </button>

      <div
        className={`absolute left-0 mt-2 w-64 bg-white text-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50 transform transition-all duration-200 ease-out ${
          open
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="py-1">
          <button
            onClick={() => handleExport(() => exportDocsAdm(showToast))}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
          >
            Documentos Administrativos
          </button>
          <button
            onClick={() => handleExport(() => exportProcJud(showToast))}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
          >
            Processos Judiciais
          </button>
          <button
            onClick={() => handleExport(() => exportProcAdm(showToast))}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
          >
            Processos Administrativos
          </button>
        </div>
      </div>
    </div>
  )
}
