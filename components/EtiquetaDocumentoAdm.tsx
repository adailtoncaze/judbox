"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import Image from "next/image"

type EtiquetaDocumentoAdmProps = {
  caixaId: string   // 🔹 novo: id real da caixa
  numero: string
  destinacao?: "preservar" | "eliminar" | null
  observacao?: string
  ano_min?: number | null
  ano_max?: number | null
}

export default function EtiquetaDocumentoAdm({
  caixaId,
  numero,
  destinacao,
  observacao,
  ano_min,
  ano_max,
}: EtiquetaDocumentoAdmProps) {
  const [zona, setZona] = useState<string>("")
  const [docsObs, setDocsObs] = useState<string>("")

  // 🔹 Pega a zona do e-mail do usuário
  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser()
      const email = data?.user?.email || ""
      const match = email.match(/zon(\d+)/)
      if (match) setZona(match[1])
    }
    loadUser()
  }, [])

  // 🔹 Buscar documentos vinculados a esta caixa
  useEffect(() => {
    async function loadDocs() {
      if (!caixaId) return
      const { data, error } = await supabase
        .from("documentos_adm")
        .select("especie_documental, data_limite")
        .eq("caixa_id", caixaId)
        .order("data_limite", { ascending: true })

      if (!error && data) {
        const obsString = data
          .map((d) => `${d.especie_documental} - ${d.data_limite ?? "—"}`)
          .join("; ")
        setDocsObs(obsString)
      }
    }
    loadDocs()
  }, [caixaId])

  return (
    <div
      className="
        w-[12cm] h-[18cm] border-2 border-black rounded-md bg-white
        flex flex-col text-black font-sans text-xs
        print:w-[12cm] print:h-[18cm]
      "
    >
      {/* Linha 1 - Logo + TRE-PB */}
      <div className="flex flex-col justify-center items-center py-2">
        <Image
          src="/logo-tre-2.png"
          alt="Logo TRE-PB"
          width={55}
          height={55}
          className="object-contain mb-1"
        />
        <p className="text-base font-bold">TRE-PB</p>
        <p className="text-sm font-semibold">Tribunal Regional Eleitoral da Paraíba</p>
      </div>

      {/* Linha 2 - Zona Eleitoral */}
      <div className="text-center text-white font-semibold border-t border-b border-black py-1 bg-indigo-600 text-sm">
        {zona ? `${zona}ª Zona Eleitoral - Guarabira` : "Zona Eleitoral - Guarabira"}
      </div>

      {/* Linha 3 - Número de identificação */}
      <div className="text-center text-white font-semibold border-b border-black py-1 bg-indigo-600 text-sm">
        Número de identificação
      </div>

      {/* Linha 4 - Número da Caixa */}
      <div className="flex justify-center items-center h-12 border-b border-black">
        <span className="text-4xl font-bold">{numero}</span>
      </div>

      {/* Linha 5 - Informações arquivísticas */}
      <div className="text-center text-white font-semibold border-b border-black py-1 bg-indigo-600 text-sm">
        Informações arquivísticas
      </div>

      {/* Linha 6 - Destinação */}
      <div className="flex justify-center items-center gap-6 border-b border-black py-1 text-sm">
        <span className="font-semibold">Destinação:</span>
        <span className="font-semibold">
          ({destinacao === "preservar" ? "X" : " "}) Preservar
        </span>
        <span className="font-semibold">
          ({destinacao === "eliminar" ? "X" : " "}) Eliminar
        </span>
      </div>

      {/* Linha 7 - Datas limite */}
      <div className="flex items-center gap-2 border-b border-black py-1 px-2 text-sm">
        <span className="font-semibold">Datas-Limite:</span>
        <span>
          {ano_min && ano_max
            ? `Anos dos documentos: ${ano_min} a ${ano_max}`
            : "—"}
        </span>
      </div>

      {/* Linha 8 - Tipo de Documento */}
      <div className="flex items-center gap-2 border-b border-black py-1 px-2 text-sm">
        <span className="font-semibold">Tipo:</span>
        <span>Documento Administrativo</span>
      </div>

      {/* Linha 9 - Observações */}
      <div className="text-center text-white font-semibold border-b border-black py-1 bg-indigo-600 text-sm">
        Observações
      </div>
      <div className="gap-2 py-1 px-2 text-[18px]">
        <span>{docsObs || observacao || "—"}</span>
      </div>
    </div>
  )
}
