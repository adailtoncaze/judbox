// app/relatorios/_components/ReportOverviewStatic.tsx
// ✅ Versão 100% síncrona para uso no PDF (renderToStaticMarkup)

import Donut from "./charts/Donut";
import Bars from "./charts/Bars";

export type StaticHeaderMeta = {
  titulo: string;
  geradoEmISO: string;
  usuario?: string | null;
  brasaoImgSrc?: string; // deve vir pronto (Data URI) pelo route
};

type Props = {
  header: StaticHeaderMeta; // inclui brasaoImgSrc
  totalCaixas: number;
  destPreservar: number;
  destEliminar: number;
  pTot: number;
  pJud: number;
  pAdm: number;
  docsAdm: number;
  cxJud: number;
  cxAdm: number;
  cxDoc: number;
};

export default function ReportOverviewStatic({
  header,
  totalCaixas,
  destPreservar,
  destEliminar,
  pTot,
  pJud,
  pAdm,
  docsAdm,
  cxJud,
  cxAdm,
  cxDoc,
}: Props) {
  const tipoLabels: Record<string, string> = {
    processo_judicial: "Processos Judiciais",
    processo_administrativo: "Processo Administrativo",
    documento_administrativo: "Documentos Administrativos",
  };

  return (
    <div className="mx-auto max-w-[900px] text-gray-900 overflow-x-hidden print:overflow-visible">
      {/* ===== Header inline síncrono (sem await) ===== */}
      <header className="mb-6">
        <div className="flex items-center gap-3">
          {header.brasaoImgSrc ? (
            <div className="h-12 w-12 overflow-hidden rounded-none shrink-0 print:shrink-0">
              <img
                src={header.brasaoImgSrc}
                alt="Brasão da República Federativa do Brasil"
                width={52}
                height={52}
                className="block -translate-x-[2px] object-contain select-none"
                draggable={false}
                loading="eager"
                style={{ imageRendering: "auto" }}
              />
            </div>
          ) : (
            <div className="h-12 w-12" />
          )}

          <div className="flex-1">
            <h1 className="text-xl text-gray-800">{header.titulo}</h1>
            <p className="text-xs text-gray-600">
              Gerado em: {new Date(header.geradoEmISO).toLocaleString("pt-BR")}
            </p>
            {header.usuario && <p className="text-xs text-gray-600">Usuário: {header.usuario}</p>}
          </div>
        </div>

        {/* Linha sutil abaixo do bloco */}
        <div className="mt-2 border-b border-gray-200/70 print:border-gray-300/80" />
      </header>

      <h2 className="text-2xl text-gray-600 font-semibold text-center mt-3 mb-6">
        Resumo Geral do Inventário
      </h2>

      {/* KPIs de caixas */}
      <section className="mb-6 grid grid-cols-1 gap-3 text-center text-[14px] sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-gray-500">Total de Caixas</p>
          <p className="mt-1 text-xl font-semibold">{totalCaixas}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-gray-500">Preservar</p>
          <p className="mt-1 text-xl font-semibold">{destPreservar}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-gray-500">Eliminar</p>
          <p className="mt-1 text-xl font-semibold">{destEliminar}</p>
        </div>
      </section>

      {/* —— LINHA 1: APENAS OS 2 DONUTS —— */}
      <section className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2 print:grid-cols-2" style={{ breakInside: "avoid" }}>
        <div className="rounded-xl border border-gray-200 p-3" style={{ breakInside: "avoid" }}>
          <div className="aspect-square w-full max-w-[220px] mx-auto">
            <Donut
              title="Processos por tipo"
              data={[
                { label: "Judiciais", value: pJud },
                { label: "Administrativos", value: pAdm },
              ]}
              colors={["#6366F1", "#10B981"]}
              padAngle={3}
              thickness={14}
              size={140}
            />
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 p-3" style={{ breakInside: "avoid" }}>
          <div className="aspect-square w-full max-w-[220px] mx-auto">
            <Donut
              title="Caixas por tipo"
              data={[
                { label: "Proc. Judiciais", value: cxJud },
                { label: "Proc. Administrativos", value: cxAdm },
                { label: "Docs. Administrativos", value: cxDoc },
              ]}
              colors={["#6366F1", "#F59E0B", "#10B981"]}
              padAngle={3}
              thickness={14}
              size={140}
            />
          </div>
        </div>
      </section>

      {/* —— LINHA 2: BARRAS SOZINHO —— */}
      <section className="mb-6" style={{ breakInside: "avoid" }}>
        <div className="rounded-xl border border-gray-200 p-3 overflow-hidden">
          <div className="mx-auto w-full max-w-[680px]">
            <Bars
              title="Itens (contagem)"
              data={[
                { label: "Processos", value: pTot },
                { label: "Judiciais", value: pJud },
                { label: "Administrativos", value: pAdm },
                { label: "Docs. Adm.", value: docsAdm },
              ]}
              fontSize={9}
            />
          </div>
        </div>
      </section>

      {/* Caixas por tipo (números) */}
      <section className="rounded-xl border border-gray-200 p-4 text-sm">
        <h2 className="mb-3 text-[15px] font-medium text-gray-700">Caixas por tipo</h2>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(["processo_judicial", "processo_administrativo", "documento_administrativo"] as const).map((t) => (
            <li key={t} className="rounded-lg border border-gray-200 p-3">
              <div className="text-[14px] text-gray-500 text-center">{tipoLabels[t]}</div>
              <div className="text-xl font-semibold text-center">
                {t === "processo_judicial" ? cxJud : t === "processo_administrativo" ? cxAdm : cxDoc}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <style>{`
        @page { size: A4; margin: 12mm; }
        section, header, footer, table, tr, td, th { break-inside: avoid; page-break-inside: avoid; }
      `}</style>
    </div>
  );
}
