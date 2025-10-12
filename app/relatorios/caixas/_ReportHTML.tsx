// app/relatorios/caixas/_ReportHTML.tsx
type Caixa = {
  id: string;
  numero_caixa: string;
  tipo: string;
  descricao?: string | null;
  localizacao?: string | null;
  destinacao?: string | null;
};

type Filtros = { tipo?: string | null; numero?: string | null };
type Meta = { titulo: string; subtitulo?: string; geradoEmISO: string; usuario?: string };

export default function ReportHTML({
  dados,
  filtros,
  meta,
  brasaoImgSrc,
}: {
  dados: Caixa[];
  filtros: Filtros;
  meta: Meta;
  brasaoImgSrc?: string;
}) {
  // —— Helpers ——
  const humanizeTipo = (t: string) => {
    switch (t) {
      case "documento_administrativo":
        return "Documento Administrativo";
      case "processo_judicial":
        return "Processo Judicial";
      case "processo_administrativo":
        return "Processo Administrativo";
      default:
        return t
          .split("_")
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
          .join(" ");
    }
  };

  const capitalizeFirst = (s?: string | null) => {
    if (!s) return "—";
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  // —— Contagens ——
  const total = dados.length;
  const totalJud = dados.filter((c) => c.tipo === "processo_judicial").length;
  const totalAdmProc = dados.filter((c) => c.tipo === "processo_administrativo").length;
  const totalDocAdm = dados.filter((c) => c.tipo === "documento_administrativo").length;

  // —— Filtro / Título dinâmico ——
  const currentTipoRaw = (filtros?.tipo ?? "todos").toString();
  const currentTipo = currentTipoRaw.toLowerCase();
  const showAll = currentTipo === "todos";

  const tituloDinamico = showAll ? "Lista de Caixas" : `Caixas - ${humanizeTipo(currentTipo)}`;

  const countForCurrent =
    currentTipo === "processo_judicial"
      ? totalJud
      : currentTipo === "processo_administrativo"
      ? totalAdmProc
      : currentTipo === "documento_administrativo"
      ? totalDocAdm
      : total;

  return (
    <div className="mx-auto max-w-[760px] text-gray-900">
      {/* Cabeçalho: brasão + textos */}
      <header className="mb-6 no-break">
        <div className="flex items-center gap-3">
          {brasaoImgSrc ? (
            <div className="h-12 w-12 overflow-hidden rounded-none shrink-0 print:shrink-0">
              <img
                src={brasaoImgSrc}
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
            <h1 className="text-xl text-gray-800">{meta.titulo}</h1>
            <p className="text-xs text-gray-600">
              Gerado em: {new Date(meta.geradoEmISO).toLocaleString("pt-BR")}
            </p>
            {meta.usuario && <p className="text-xs text-gray-600">Usuário: {meta.usuario}</p>}
          </div>
        </div>

        {/* Título da listagem */}
        <h2 className="rounded bg-gray-50 text-2xl text-gray-600 font-semibold text-center pt-6 pb-4 mt-6">
          {tituloDinamico}
        </h2>
      </header>

      {/* Cards — sempre 2×2 no PDF e também no desktop */}
      {showAll ? (
        <section
          className="
            mb-4 grid grid-cols-1 gap-3 text-center text-xs
            sm:grid-cols-2 md:grid-cols-2 print:grid-cols-2
            no-break
          "
        >
          <div className="rounded border border-gray-200 p-3">
            <p className="text-gray-500">Total de Caixas</p>
            <p className="mt-1 text-lg font-semibold">{total}</p>
          </div>

          <div className="rounded border border-gray-200 p-3">
            <p className="text-gray-500">Proc. Judiciais</p>
            <p className="mt-1 text-lg font-semibold">{totalJud}</p>
          </div>

          <div className="rounded border border-gray-200 p-3">
            <p className="text-gray-500">Proc. Administrativos</p>
            <p className="mt-1 text-lg font-semibold">{totalAdmProc}</p>
          </div>

          <div className="rounded border border-gray-200 p-3">
            <p className="text-gray-500">Docs. Administrativos</p>
            <p className="mt-1 text-lg font-semibold">{totalDocAdm}</p>
          </div>
        </section>
      ) : (
        <section className="mb-4 grid grid-cols-1 gap-3 text-center text-xs print:grid-cols-1 no-break">
          <div className="rounded border border-gray-200 p-3">
            <p className="text-gray-500">{humanizeTipo(currentTipo)}</p>
            <p className="mt-1 text-lg font-semibold">{countForCurrent}</p>
          </div>
        </section>
      )}

      {/* Tabela */}
      <section >
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium text-gray-700"># Caixa</th>
              <th className="px-4 py-3 font-medium text-gray-700">Tipo</th>
              <th className="px-4 py-3 font-medium text-gray-700">Cidade</th>
              <th className="px-4 py-3 font-medium text-gray-700">Destinação</th>
            </tr>
          </thead>
          <tbody>
            {dados.map((c) => (
              <tr key={c.id} className="odd:bg-white even:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3">{c.numero_caixa}</td>
                <td className="px-4 py-3">{humanizeTipo(c.tipo)}</td>
                <td className="px-4 py-3">{c.localizacao || "—"}</td>
                <td className="px-4 py-3">{capitalizeFirst(c.destinacao)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer className="mt-6 text-center text-[10px] text-gray-500">
        Documento gerado pelo JudBox · {new Date(meta.geradoEmISO).toLocaleDateString("pt-BR")}
      </footer>

      <style>{`
  /* Evite quebras indevidas só onde precisa */
  .no-break { break-inside: avoid; page-break-inside: avoid; }

  @media print {
    table, tr, td, th { break-inside: auto; page-break-inside: auto; }
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
  }
`}</style>

    </div>
  );
}
