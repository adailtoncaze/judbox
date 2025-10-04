import { supabase } from "@/lib/supabaseClient"
import { saveAs } from "file-saver"
import { useToast } from "@/hooks/useToast"

function getDateStamp() {
  return new Date().toISOString().split("T")[0]
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

    let csv =
      "Espécie Documental,Data Limite,Quantidade de Caixas,Número das Caixas,Observação\n"

    data.forEach((d: any) => {
      csv += `"${d.especie_documental}","${d.data_limite}","${d.quantidade_caixas}","${d.numero_caixas}","${d.observacao ?? ""}"\n`
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
        caixas!inner (numero_caixa, tipo)
      `
      )
      .eq("caixas.tipo", "processo_judicial") // ✅ agora o filtro funciona corretamente com inner join

    if (error) throw error
    if (!data || data.length === 0) {
      showToast("Nenhum processo judicial encontrado.", "error")
      return
    }

    let csv =
      "Nº da Caixa,Tipo de Processo,Nº do Processo,Protocolo,Ano,Quantidade de Volumes,Nº de Caixas,Observação\n"

    data.forEach((p: any) => {
      csv += `"${p.caixas?.numero_caixa ?? ""}","${p.classe_processual ?? ""}","${p.numero_processo ?? ""}","${p.protocolo ?? ""}","${p.ano ?? ""}","${p.quantidade_volumes ?? ""}","${p.numero_caixas ?? ""}","${p.observacao ?? ""}"\n`
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
        caixas!inner (numero_caixa, tipo)
      `
      )
      .eq("caixas.tipo", "processo_administrativo") // ✅ idem aqui, join com filtro correto

    if (error) throw error
    if (!data || data.length === 0) {
      showToast("Nenhum processo administrativo encontrado.", "error")
      return
    }

    let csv =
      "Nº da Caixa,Tipo de Processo,Nº do Processo,Protocolo,Ano,Quantidade de Volumes,Nº de Caixas,Observação\n"

    data.forEach((p: any) => {
      csv += `"${p.caixas?.numero_caixa ?? ""}","${p.classe_processual ?? ""}","${p.numero_processo ?? ""}","${p.protocolo ?? ""}","${p.ano ?? ""}","${p.quantidade_volumes ?? ""}","${p.numero_caixas ?? ""}","${p.observacao ?? ""}"\n`
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
