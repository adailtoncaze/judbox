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

type Pagination = {
  page: number;         // 1-based
  pageSize: number;
  total: number;        // total real (filtro atual)
  totalPages: number;
  makeHref: (page: number) => string;
};

type Stats = {
  all: number;
  jud: number;
  adm: number;
  doc: number;
};

export default function ReportHTML({
  dados,
  filtros,
  meta,
  brasaoImgSrc,
  pagination,
  stats,          // 👈 NOVO
}: {
  dados: Caixa[];
  filtros: Filtros;
  meta: Meta;
  brasaoImgSrc?: string;
  pagination?: Pagination;
  stats?: Stats;        // 👈 NOVO
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

  // —— Contagens do LOTE VISÍVEL (fallback) ——:
  const totalVisivel = dados.length;
  const totalJudVis = dados.filter((c) => c.tipo === "processo_judicial").length;
  const totalAdmVis = dados.filter((c) => c.tipo === "processo_administrativo").length;
  const totalDocVis = dados.filter((c) => c.tipo === "documento_administrativo").length;

  // —— Filtro / Título dinâmico ——
  const currentTipoRaw = (filtros?.tipo ?? "todos").toString();
  const currentTipo = currentTipoRaw.toLowerCase();
  const showAll = currentTipo === "todos";

  const tituloDinamico = showAll ? "Lista de Caixas" : `Caixas - ${humanizeTipo(currentTipo)}`;

  // Faixa mostrada (para legenda “Mostrando X–Y de Z”)
  const from = pagination ? (pagination.page - 1) * pagination.pageSize + (totalVisivel ? 1 : 0) : (totalVisivel ? 1 : 0);
  const to = pagination ? Math.min(pagination.page * pagination.pageSize, pagination.total) : totalVisivel;

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
        <h2 className="rounded bg-gray-100 text-2xl text-gray-600 font-semibold text-center pt-6 pb-4 mt-6">
          {tituloDinamico}
        </h2>
      </header>

      {/* Cards */}
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
            <p className="mt-1 text-lg font-semibold">
              {(stats?.all ?? totalVisivel).toLocaleString("pt-BR")}
            </p>
            {pagination && (
              <p className="mt-1 text-[11px] text-gray-500">
                Mostrando {from.toLocaleString("pt-BR")}–{to.toLocaleString("pt-BR")} de{" "}
                <b>{(pagination.total ?? totalVisivel).toLocaleString("pt-BR")}</b>
              </p>
            )}
          </div>

          <div className="rounded border border-gray-200 p-3">
            <p className="text-gray-500">Proc. Judiciais</p>
            <p className="mt-1 text-lg font-semibold">
              {(stats?.jud ?? totalJudVis).toLocaleString("pt-BR")}
            </p>
          </div>

          <div className="rounded border border-gray-200 p-3">
            <p className="text-gray-500">Proc. Administrativos</p>
            <p className="mt-1 text-lg font-semibold">
              {(stats?.adm ?? totalAdmVis).toLocaleString("pt-BR")}
            </p>
          </div>

          <div className="rounded border border-gray-200 p-3">
            <p className="text-gray-500">Docs. Administrativos</p>
            <p className="mt-1 text-lg font-semibold">
              {(stats?.doc ?? totalDocVis).toLocaleString("pt-BR")}
            </p>
          </div>
        </section>
      ) : (
        <section className="mb-4 grid grid-cols-1 gap-3 text-center text-xs print:grid-cols-1 no-break">
          <div className="rounded border border-gray-200 p-3">
            <p className="text-gray-500">{humanizeTipo(currentTipo)}</p>
            <p className="mt-1 text-lg font-semibold">{totalVisivel}</p>
          </div>
        </section>
      )}

      {/* Tabela (sem zebra) */}
      <section >
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-100">
            <tr className="text-left">
              <th className="px-4 py-2 font-medium text-gray-700"># Caixa</th>
              <th className="px-4 py-2 font-medium text-gray-700">Tipo</th>
              <th className="px-4 py-2 font-medium text-gray-700">Cidade</th>
              <th className="px-4 py-2 font-medium text-gray-700">Destinação</th>
            </tr>
          </thead>
          <tbody>
            {dados.map((c) => (
              <tr key={c.id}>
                <td className="whitespace-nowrap px-4 py-2">{c.numero_caixa}</td>
                <td className="px-4 py-2">{humanizeTipo(c.tipo)}</td>
                <td className="px-4 py-2">{c.localizacao || "—"}</td>
                <td className="px-4 py-2">{capitalizeFirst(c.destinacao)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Paginação (links) */}
      {pagination && pagination.totalPages > 1 ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-gray-600">
            Página {pagination.page} de {pagination.totalPages}
          </div>
          <div className="flex items-center gap-1">
            {(() => {
              const p = pagination;
              const first = 1;
              const last = p.totalPages;
              const prev = Math.max(first, p.page - 1);
              const next = Math.min(last, p.page + 1);
              return (
                <>
                  <a
                    href={p.makeHref(first)}
                    className="px-2 py-1 text-xs rounded border border-gray-200 hover:bg-gray-50"
                    aria-label="Primeira página"
                  >
                    «
                  </a>
                  <a
                    href={p.makeHref(prev)}
                    className="px-2 py-1 text-xs rounded border border-gray-200 hover:bg-gray-50"
                    aria-label="Anterior"
                  >
                    ‹
                  </a>
                  <a
                    href={p.makeHref(next)}
                    className="px-2 py-1 text-xs rounded border border-gray-200 hover:bg-gray-50"
                    aria-label="Próxima"
                  >
                    ›
                  </a>
                  <a
                    href={p.makeHref(last)}
                    className="px-2 py-1 text-xs rounded border border-gray-200 hover:bg-gray-50"
                    aria-label="Última página"
                  >
                    »
                  </a>
                </>
              );
            })()}
          </div>
        </div>
      ) : null}

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
    tbody td { padding-top: 6px !important; padding-bottom: 6px !important; line-height: 1.25; }
  }
`}</style>

    </div>
  );
}
