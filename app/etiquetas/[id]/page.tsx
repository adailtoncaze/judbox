"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import EtiquetaProcesso from "@/components/EtiquetaProcesso"
import EtiquetaDocumentoAdm from "@/components/EtiquetaDocumentoAdm"

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

type DocumentoAdm = {
  id: string
  especie_documental: string
  data_limite: string | null
  quantidade_caixas: number | null
  numero_caixas: number | null
  observacao: string | null
  caixa_id: string
}

export default function EtiquetasPage() {
  const routeParams = useParams()
  const caixaId = routeParams?.id as string

  const [caixa, setCaixa] = useState<Caixa | null>(null)
  const [processos, setProcessos] = useState<Processo[]>([])
  const [documentos, setDocumentos] = useState<DocumentoAdm[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!caixaId) return
    ;(async () => {
      try {
        setLoading(true)
        setError(null)

        // Caixa
        const { data: caixaData, error: caixaErr } = await supabase
          .from("caixas")
          .select("*")
          .eq("id", caixaId)
          .single()

        if (caixaErr) throw caixaErr
        setCaixa(caixaData as Caixa)

        if (caixaData?.tipo === "processo_judicial" || caixaData?.tipo === "processo_administrativo") {
          // Processos
          const { data: procData, error: procErr } = await supabase
            .from("processos")
            .select("*")
            .eq("caixa_id", caixaId)
            .order("ano", { ascending: true })

          if (procErr) throw procErr
          setProcessos((procData || []) as Processo[])
        } else if (caixaData?.tipo === "documento_administrativo") {
          // Documentos administrativos
          const { data: docData, error: docErr } = await supabase
            .from("documentos_adm")
            .select("*")
            .eq("caixa_id", caixaId)

          if (docErr) throw docErr
          setDocumentos((docData || []) as DocumentoAdm[])
        }
      } catch (e: any) {
        console.error(e)
        setError("Falha ao carregar dados da etiqueta.")
      } finally {
        setLoading(false)
      }
    })()
  }, [caixaId])

  if (loading) return <p className="text-center mt-10">Gerando etiqueta...</p>
  if (error) return <p className="text-center text-red-600 mt-10">{error}</p>
  if (!caixa) return <p className="text-center text-red-600 mt-10">Caixa não encontrada.</p>

  // 🔹 Se for Documentos Administrativos
  if (caixa.tipo === "documento_administrativo") {
    // Calcular ano_min e ano_max a partir de data_limite
    const anos = documentos
      .map((d) => (d.data_limite ? parseInt(d.data_limite) : null))
      .filter((n): n is number => n !== null)

    const ano_min = anos.length ? Math.min(...anos) : null
    const ano_max = anos.length ? Math.max(...anos) : null

    // 🔹 Gerar observação "especie-ano; especie-ano; ..."
    const observacaoGerada = documentos
      .map((d) => `${d.especie_documental}-${d.data_limite || "—"}`)
      .join("; ")

    const etiquetaProps = {
      caixaId: caixa.id,                 // ✅ agora passamos o ID exigido pelo componente
      numero: caixa.numero_caixa,
      destinacao: caixa.destinacao ?? null,
      observacao: observacaoGerada || undefined,
      ano_min,
      ano_max,
    }

    return (
      <div
        className="
          flex flex-row justify-center gap-6 w-full min-h-screen p-4
          print:w-full print:min-h-0 print:p-0 print:gap-4
        "
      >
        <div className="shrink-0">
          <EtiquetaDocumentoAdm {...etiquetaProps} />
        </div>
        <div className="shrink-0">
          <EtiquetaDocumentoAdm {...etiquetaProps} />
        </div>

        {/* Botão imprimir */}
        <button
          onClick={() => window.print()}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow text-lg font-semibold print:hidden cursor-pointer"
        >
          Imprimir
        </button>
      </div>
    )
  }

  // 🔹 Se for Processos (judicial ou administrativo)
  const etiquetaProps = {
    numero: caixa.numero_caixa,
    tipo: caixa.tipo === "processo_judicial" ? "judicial" : "administrativo",
    processos: processos.map((p) => ({
      numero_processo: p.numero_processo,
      ano: p.ano,
      tipo_processo: p.tipo_processo,
      classe_processual: p.classe_processual,
    })),
    protocolo: processos[0]?.protocolo ?? undefined,
    qtd_volumes: processos[0]?.quantidade_volumes ?? undefined,
    qtd_caixas: processos[0]?.numero_caixas ?? undefined,
    observacao: processos[0]?.observacao ?? undefined,
    destinacao: caixa.destinacao ?? undefined, // ✅ converte null -> undefined
  }

  return (
    <div
      className="
        flex flex-row justify-center gap-6 w-full min-h-screen p-4
        print:w-full print:min-h-0 print:p-0 print:gap-4
      "
    >
      <div className="shrink-0">
        <EtiquetaProcesso {...etiquetaProps} />
      </div>
      <div className="shrink-0">
        <EtiquetaProcesso {...etiquetaProps} />
      </div>

      {/* Botão imprimir */}
      <button
        onClick={() => window.print()}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow text-lg font-semibold print:hidden"
      >
        Imprimir
      </button>
    </div>
  )
}
