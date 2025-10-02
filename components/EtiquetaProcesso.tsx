"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import Image from "next/image"

type Processo = {
  numero_processo: string
  ano: number
  tipo_processo: string
  classe_processual: string
}

type EtiquetaProcessoProps = {
  numero: string
  tipo: string
  processos: Processo[]
  protocolo?: string
  qtd_volumes?: number
  qtd_caixas?: number
  observacao?: string
  destinacao?: "preservar" | "eliminar"
}

export default function EtiquetaProcesso({
  numero,
  tipo,
  processos,
  protocolo,
  qtd_volumes,
  qtd_caixas,
  observacao,
  destinacao,
}: EtiquetaProcessoProps) {
  const [zona, setZona] = useState<string>("")

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser()
      const email = data?.user?.email || ""
      const match = email.match(/zon(\d+)/)
      if (match) {
        setZona(match[1])
      }
    }
    loadUser()
  }, [])

  // Calcular anos limite
  const anos = processos.map((p) => p.ano)
  const anoMin = anos.length ? Math.min(...anos) : null
  const anoMax = anos.length ? Math.max(...anos) : null

  return (
    <div
      className="
        w-[12cm] h-[20cm] border-2 border-black rounded-md bg-white
        flex flex-col text-black font-sans text-xs
        print:w-[12cm] print:h-[20cm]
      "
    >
      {/* Linha 1 - Logo + TRE-PB */}
      <div className="flex flex-col justify-center py-2 items-center">
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
      <div className="text-center text-white font-semibold border-t border-b border-black bg-indigo-600 text-sm">
        {zona ? `${zona}ª Zona Eleitoral - Guarabira` : "Zona Eleitoral - Guarabira"}
      </div>

      {/* Linha 3 - Número de identificação */}
      <div className="text-center text-white font-semibold border-b border-black bg-indigo-600 text-sm">
        Número de identificação
      </div>

      {/* Linha 4 - Número da Caixa */}
      <div className="flex justify-center items-center h-10 border-b border-black">
        <span className="text-4xl font-bold">{numero}</span>
      </div>

      {/* Linha 5 - Informações arquivísticas */}
      <div className="text-center text-white font-semibold border-b border-black py-1 bg-indigo-600 text-sm">
        Informações arquivísticas
      </div>

      {/* Linha 6 - Destinação */}
      <div className="flex justify-center items-center gap-6 border-b border-black text-sm">
        <span className="font-semibold">Destinação:</span>
        <span className="font-semibold">
          ({destinacao === "preservar" ? "X" : " "}) Preservar
        </span>
        <span className="font-semibold">
          ({destinacao === "eliminar" ? "X" : " "}) Eliminar
        </span>
      </div>

      {/* Linha 7 - Datas limite */}
      <div className="flex items-center gap-2 border-b border-black px-2 text-sm">
        <span className="font-semibold">Datas-Limite:</span>
        <span>
          {anoMin && anoMax ? `Ano dos processos: ${anoMin} a ${anoMax}` : "—"}
        </span>
      </div>

      {/* Linha 8 - Observação */}
      <div className="flex items-center gap-2 border-b border-black py-1 px-2 text-sm">
        <span className="font-semibold">Observações:</span>
        <span>{tipo}</span>
      </div>

      {/* Linha 9 - Tabela de processos */}
      <div className="flex-1 overflow-hidden">
        <table className="w-full border-collapse text-[11px] table-fixed">
          <thead>
            <tr className="bg-gray-100 border-b border-black">
              <th className="border border-black px-1 py-0.5 text-left w-[100px]">Número do processo</th>
              <th className="border border-black px-1 py-0.5 text-left w-[50px]">Ano</th>
              <th className="border border-black px-1 py-0.5 text-left w-[150px]">Tipo de processo</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 20 }).map((_, i) => {
              const proc = processos[i]
              return (
                <tr key={i} className="border-b border-black">
                  <td className="border border-black px-1 py-0.5 text-[12px] w-[200px] truncate">
                    {proc ? proc.numero_processo : "—"}
                  </td>
                  <td className="border border-black px-1 py-0.5 text-[12px] w-[80px] text-center">
                    {proc ? proc.ano : "—"}
                  </td>
                  <td className="border border-black px-1 py-0.5 text-[12px] w-[150px] capitalize truncate">
                    {proc ? proc.classe_processual : "—"}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

    </div>
  )
}
