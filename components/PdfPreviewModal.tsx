// components/PdfPreviewModal.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { XMarkIcon, DocumentArrowDownIcon } from "@heroicons/react/24/outline";

type Kind = "geral" | "listagem" | "por-tipo";

type Props = {
  open: boolean;
  onClose: () => void;
  // valores iniciais vindos do Header/URL
  tipo: string;
  numero: string;
};

export default function PdfPreviewModal({ open, onClose, tipo, numero }: Props) {
  // --- Hooks (sempre na mesma ordem) ---
  const [kind, setKind] = useState<Kind>("listagem");
  const [tipoSel, setTipoSel] = useState<string>(tipo || "todos");
  const [numeroSel, setNumeroSel] = useState<string>(numero || "");
  const [iframeLoading, setIframeLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 🔧 injeta CSS global e alterna classes para fundo branco/sem faixa
  const globalStyleRef = useRef<HTMLStyleElement | null>(null);
  useEffect(() => {
    const body = document.body;

    if (!open) {
      body.classList.remove("modal-open");
      return;
    }

    // injeta a folha de estilos (uma única vez)
    if (!globalStyleRef.current) {
      const style = document.createElement("style");
      style.id = "pdfpreview-modal-styles";
      style.textContent = `
        /* Classe aplicada ao <body> enquanto o modal está aberto */
        .modal-open {
          overflow: hidden;                     /* desativa scroll do fundo */
          background: #fff !important;          /* fundo branco sólido */
          scrollbar-gutter: stable both-edges;  /* reserva espaço da barra (evita salto) */
        }
      `;
      document.head.appendChild(style);
      globalStyleRef.current = style;
    }

    body.classList.add("modal-open");

    return () => {
      body.classList.remove("modal-open");
    };
  }, [open]);

  // Persistência leve da última escolha
  useEffect(() => {
    if (!open) return;
    const last = localStorage.getItem("report:last");
    if (last) {
      try {
        const parsed = JSON.parse(last);
        setKind(parsed.kind ?? "listagem");
        setTipoSel(parsed.tipo ?? "todos");
        setNumeroSel(parsed.numero ?? "");
      } catch {
        // ignore
      }
    } else {
      setKind("listagem");
      setTipoSel(tipo || "todos");
      setNumeroSel(numero || "");
    }
  }, [open, tipo, numero]);

  useEffect(() => {
    if (!open) return;
    localStorage.setItem("report:last", JSON.stringify({ kind, tipo: tipoSel, numero: numeroSel }));
  }, [open, kind, tipoSel, numeroSel]);

  // Sempre que mudam filtros/tipo, mostra loading até o iframe carregar de novo
  useEffect(() => {
    if (open) setIframeLoading(true);
  }, [open, kind, tipoSel, numeroSel]);

  // --- Importante: não retornar antes dos hooks acima ---
  if (!open) return null;

  // Query da pré-visualização (sem datas)
  const qs = new URLSearchParams(
    kind === "geral" ? { kind } : { kind, tipo: tipoSel || "todos", numero: numeroSel || "" }
  ).toString();

  const previewUrl = `/relatorios/caixas/preview?${qs}`;

  const baixarPDF = async () => {
    try {
      setDownloading(true);
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          filters: kind === "geral" ? {} : { tipo: tipoSel || "todos", numero: numeroSel || "" },
        }),
      });
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        const msg = await res.text().catch(() => "");
        alert(msg || "Falha ao gerar PDF.");
        return;
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
      setDownloading(false);
    }
  };

  // injeta CSS no documento do iframe para forçar fundo branco e dar respiro interno (topo menor)
  const paintIframeWhite = () => {
    const el = iframeRef.current;
    if (!el) return;
    const doc = el.contentDocument || el.contentWindow?.document;
    if (!doc) return;

    try {
      doc.body.classList.remove(
        "bg-gray-50","bg-slate-50","bg-neutral-50","bg-zinc-50",
        "bg-gray-100","bg-slate-100","bg-neutral-100","bg-zinc-100"
      );

      const style = doc.createElement("style");
      style.innerHTML = `
        :root, html, body { background: #ffffff !important; }
        html { color-scheme: light; scrollbar-gutter: stable; }
        /* respiro interno do preview — topo reduzido */
        body { min-height: 100%; padding-top: 2px !important; padding-bottom: 32px !important; }
        @media (min-width: 768px) {
          body { padding-top: 4px !important; padding-bottom: 40px !important; }
        }
        /* se o wrapper do preview tiver padding próprio, zere o topo para colar mais ao container */
        body > div:first-child { padding-top: 2px !important; margin-top: 0 !important; }
      `;
      doc.head.appendChild(style);

      doc.documentElement.style.backgroundColor = "#ffffff";
      (doc.body as HTMLBodyElement).style.backgroundColor = "#ffffff";
    } catch {
      // silêncio: se o iframe não for mesma origem
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center" role="dialog" aria-modal="true">
      {/* overlay — não fecha ao clicar */}
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />

      <div
        className="relative z-[1001] mx-4 flex w-full max-w-6xl flex-col overflow-hidden rounded bg-white shadow-2xl ring-1 ring-black/10"
        role="document"
        aria-labelledby="pdf-preview-modal-title"
      >
        {/* Header — INDIGO (agora com Título + Fechar) */}
        <div className="flex items-center justify-between border-b border-indigo-700/50 px-4 py-2 bg-indigo-600 text-white">
          <h3
            id="pdf-preview-modal-title"
            className="text-sm md:text-base font-semibold tracking-wide"
          >
           Central de Relatórios
          </h3>

          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-lg border border-white/70 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10 transition cursor-pointer"
          >
            <XMarkIcon className="h-4 w-4 text-white" />
            Fechar
          </button>
        </div>

        {/* Body — espaçamento EXTERNO (restaurado) */}
        <div className="flex h-[75vh] w-full bg-white px-5 md:px-6 py-5 md:py-6 gap-4">
          {/* Coluna de filtros (quando aplicável) */}
          {kind === "geral" ? null : (
            <div className="w-full max-w-[260px] shrink-0 bg-gray-50 rounded-lg ring-1 ring-gray-200 overflow-hidden p-3 md:p-4">
              <div>
                <label className="block text-xs font-medium text-indigo-800">Tipo</label>
                <select
                  value={tipoSel}
                  onChange={(e) => setTipoSel(e.target.value)}
                  className="mt-1 w-full rounded-md border border-indigo-200 bg-white px-2 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="todos">Todos</option>
                  <option value="documento_administrativo">Documento administrativo</option>
                  <option value="processo_judicial">Processo judicial</option>
                  <option value="processo_administrativo">Processo administrativo</option>
                </select>
              </div>

              <div className="mt-3">
                <label className="block text-xs font-medium text-indigo-800"># Caixa (número)</label>
                <input
                  value={numeroSel}
                  onChange={(e) => setNumeroSel(e.target.value)}
                  placeholder="ex.: 001"
                  className="mt-1 w-full rounded-md border border-indigo-200 bg-white px-2 py-1.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="mt-1 text-[10px] text-indigo-700/70">
                  Busca pelo <code className="font-semibold">Número da Caixa</code>.
                </p>
              </div>
            </div>
          )}

          {/* Coluna principal */}
          <div className="relative flex-1 min-w-0 flex flex-col gap-3 md:gap-4">
            {/* 🔹 Card de controles (sticky) */}
            <div className="sticky top-0 z-20 -mt-1">
              <div className="rounded-lg ring-1 ring-gray-200 bg-gray-50 px-3 py-2 md:px-4 md:py-2.5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {/* Segmented control */}
                  <div className="inline-flex items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 p-1">
                    {(["geral", "listagem", "por-tipo"] as Kind[]).map((k) => {
                      const active = kind === k;
                      return (
                        <button
                          key={k}
                          onClick={() => setKind(k)}
                          aria-pressed={active}
                          className={[
                            "px-3 py-1.5 text-xs font-semibold rounded-lg transition",
                            "outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer",
                            active
                              ? "bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-200"
                              : "bg-transparent text-indigo-800/90 hover:bg-white/70"
                          ].join(" ")}
                        >
                          {k === "geral" ? "Resumo Geral" : k === "listagem" ? "Caixas" : "Processos/Documentos"}
                        </button>
                      );
                    })}
                  </div>

                  {/* Botão Baixar PDF */}
                  <button
                    onClick={baixarPDF}
                    disabled={downloading}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition cursor-pointer"
                  >
                    <DocumentArrowDownIcon className="h-4 w-4 text-white" />
                    {downloading ? (
                      <>
                        <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" />
                        Baixando...
                      </>
                    ) : (
                      "Baixar PDF"
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Preview (card) — padding INTERNO reduzido */}
            <div className="relative flex-1 bg-white rounded-lg ring-1 ring-gray-200 overflow-hidden p-2 md:p-3">
              {iframeLoading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white">
                  <span className="animate-spin border-2 border-indigo-600 border-t-transparent rounded-full w-8 h-8" />
                  <p className="text-sm text-gray-600">Carregando Relatório, aguarde...</p>
                </div>
              )}
              <iframe
                ref={iframeRef}
                title="Pré-visualização do Relatório"
                src={previewUrl}
                className="h-full w-full bg-white"
                onLoad={() => {
                  paintIframeWhite();
                  setIframeLoading(false);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
