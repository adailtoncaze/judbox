import { supabase } from "@/lib/supabaseClient"
import { saveAs } from "file-saver"
import { useToast } from "@/hooks/useToast"

function getDateStamp() {
  return new Date().toISOString().split("T")[0]
}

/** 🔎 Busca em lote as destinações por número da caixa */
async function buildDestMapByNumeroCaixa(numeros: string[]): Promise<Record<string, string>> {
  const uniques = Array.from(new Set(numeros.filter(Boolean).map((n) => n.trim())))
  if (uniques.length === 0) return {}
  const { data, error } = await supabase
    .from("caixas")
    .select("numero_caixa, destinacao")
    .in("numero_caixa", uniques)
  if (error || !data) return {}
  const map: Record<string, string> = {}
  data.forEach((c: any) => {
    if (c?.numero_caixa) map[c.numero_caixa] = c.destinacao ?? ""
  })
  return map
}

// ----------------- Documentos Administrativos -----------------
export async function exportDocsAdm(showToast: ReturnType<typeof useToast>["showToast"]) {
  try {
    const { data, error } = await supabase.from("documentos_adm").select("*")
    if (error) throw error
    if (!data || data.length === 0) {
      showToast("Nenhum documento administrativo encontrado.", "error")
      return
    }

    // Coleta todos os números de caixas de todos os registros p/ buscar as destinações de uma vez
    const allNumeros = new Set<string>()
    data.forEach((d: any) => {
      const nums = String(d.numero_caixas ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
      nums.forEach((n) => allNumeros.add(n))
    })
    const destMap = await buildDestMapByNumeroCaixa(Array.from(allNumeros))

    let csv =
      "Espécie Documental,Data Limite,Quantidade de Caixas,Número das Caixas,Destinação,Observação\n"

    data.forEach((d: any) => {
      const nums = String(d.numero_caixas ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)

      // Junta destinações distintas encontradas para as caixas listadas
      const destinacoes = Array.from(
        new Set(nums.map((n) => destMap[n]).filter(Boolean))
      ).join("; ")

      csv += `"${d.especie_documental}","${d.data_limite}","${d.quantidade_caixas}","${d.numero_caixas}","${destinacoes}","${d.observacao ?? ""}"\n`
    })

    saveAs(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
      `documentos_adm_${getDateStamp()}.csv`
    )

    showToast("Relatório de Documentos Administrativos exportado com sucesso!", "success")
  } catch (err: any) {
    showToast(`Erro ao exportar documentos: ${err.message || err}`, "error")
  }
}

// ----------------- Processos Judiciais -----------------
export async function exportProcJud(showToast: ReturnType<typeof useToast>["showToast"]) {
  try {
    const { data, error } = await supabase
      .from("processos")
      .select(
        `
        id,
        numero_processo,
        protocolo,
        ano,
        quantidade_volumes,
        numero_caixas,
        observacao,
        classe_processual,
        caixas!inner (numero_caixa, tipo, destinacao)
      `
      )
      .eq("caixas.tipo", "processo_judicial") // mantém o filtro pelo join

    if (error) throw error
    if (!data || data.length === 0) {
      showToast("Nenhum processo judicial encontrado.", "error")
      return
    }

    // Fallback de destinação por número da caixa (caso o aninhado venha vazio)
    const numeros = Array.from(
      new Set((data as any[]).map((p) => p?.caixas?.numero_caixa).filter(Boolean))
    ) as string[]
    const destMap = await buildDestMapByNumeroCaixa(numeros)

    let csv =
      "Nº da Caixa,Tipo de Processo,Nº do Processo,Protocolo,Ano,Quantidade de Volumes,Nº de Caixas,Destinação,Observação\n"

    ;(data as any[]).forEach((p) => {
      const numCx = p?.caixas?.numero_caixa ?? ""
      const destinacao = p?.caixas?.destinacao ?? (numCx ? destMap[numCx] ?? "" : "")

      csv += `"${numCx}","${p.classe_processual ?? ""}","${p.numero_processo ?? ""}","${p.protocolo ?? ""}","${p.ano ?? ""}","${p.quantidade_volumes ?? ""}","${p.numero_caixas ?? ""}","${destinacao}","${p.observacao ?? ""}"\n`
    })

    saveAs(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
      `processos_judiciais_${getDateStamp()}.csv`
    )

    showToast("Relatório de Processos Judiciais exportado com sucesso!", "success")
  } catch (err: any) {
    showToast(`Erro ao exportar processos judiciais: ${err.message || err}`, "error")
  }
}

// ----------------- Processos Administrativos -----------------
export async function exportProcAdm(showToast: ReturnType<typeof useToast>["showToast"]) {
  try {
    const { data, error } = await supabase
      .from("processos")
      .select(
        `
        id,
        numero_processo,
        protocolo,
        ano,
        quantidade_volumes,
        numero_caixas,
        observacao,
        classe_processual,
        caixas!inner (numero_caixa, tipo, destinacao)
      `
      )
      .eq("caixas.tipo", "processo_administrativo")

    if (error) throw error
    if (!data || data.length === 0) {
      showToast("Nenhum processo administrativo encontrado.", "error")
      return
    }

    // Fallback de destinação por número da caixa
    const numeros = Array.from(
      new Set((data as any[]).map((p) => p?.caixas?.numero_caixa).filter(Boolean))
    ) as string[]
    const destMap = await buildDestMapByNumeroCaixa(numeros)

    let csv =
      "Nº da Caixa,Tipo de Processo,Nº do Processo,Protocolo,Ano,Quantidade de Volumes,Nº de Caixas,Destinação,Observação\n"

    ;(data as any[]).forEach((p) => {
      const numCx = p?.caixas?.numero_caixa ?? ""
      const destinacao = p?.caixas?.destinacao ?? (numCx ? destMap[numCx] ?? "" : "")

      csv += `"${numCx}","${p.classe_processual ?? ""}","${p.numero_processo ?? ""}","${p.protocolo ?? ""}","${p.ano ?? ""}","${p.quantidade_volumes ?? ""}","${p.numero_caixas ?? ""}","${destinacao}","${p.observacao ?? ""}"\n`
    })

    saveAs(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
      `processos_administrativos_${getDateStamp()}.csv`
    )

    showToast("Relatório de Processos Administrativos exportado com sucesso!", "success")
  } catch (err: any) {
    showToast(`Erro ao exportar processos administrativos: ${err.message || err}`, "error")
  }
}
