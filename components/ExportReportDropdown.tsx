"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon, DocumentArrowDownIcon, EyeIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

type Props = {
  tipoSelecionado?: string | null;
  numeroBusca?: string | number | null;
};

export default function ExportReportDropdown({ tipoSelecionado = "todos", numeroBusca = "" }: Props) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const tipo = (tipoSelecionado ?? "todos") as string;
  const numero = (numeroBusca ?? "") as string | number;

  const abrirPreview = () => {
    const q = new URLSearchParams({
      tipo: String(tipo || "todos"),
      numero: String(numero || ""),
    });
    router.push(`/relatorios/caixas/preview?${q.toString()}`);
    setOpen(false);
  };

  const baixarPDF = async () => {
    try {
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, numero }),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        if (res.status === 401) {
          // não autenticado → mande pra sua rota de login (ajuste se for diferente)
          router.push("/login");
          return;
        }
        throw new Error(msg || "Falha ao gerar PDF.");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "judbox-relatorio.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro inesperado ao gerar PDF.");
    } finally {
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Relatório PDF
        <ChevronDownIcon className="h-4 w-4" />
      </button>

      {open && (
        <div
          className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
          role="menu"
        >
          <button
            onClick={abrirPreview}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
            role="menuitem"
          >
            <EyeIcon className="h-4 w-4 text-gray-600" />
            Pré-visualizar (imprimir)
          </button>
          <button
            onClick={baixarPDF}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
            role="menuitem"
          >
            <DocumentArrowDownIcon className="h-4 w-4 text-gray-600" />
            Baixar PDF (oficial)
          </button>
        </div>
      )}
    </div>
  );
}
