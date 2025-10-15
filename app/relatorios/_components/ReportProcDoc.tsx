// app/relatorios/_components/ReportProcDoc.tsx
import "server-only";

type Tipo = "processo_judicial" | "processo_administrativo" | "documento_administrativo";
type Filtros = { tipo: string; numero: string };

type Row = {
  id: string;
  caixa_id: string;
  numero_caixa: string | null;
  tipo_item: Tipo;
  classe_processual: string | null;
  especie_documental: string | null;
  numero_processo: string | null;
  protocolo: string | null;
  data_limite: string | null;
  created_at: string | null;
};

function tipoLabel(t?: string) {
  const v = (t || "").toLowerCase();
  if (v === "processo_judicial") return "Processo Judicial";
  if (v === "processo_administrativo") return "Processo Administrativo";
  if (v === "documento_administrativo") return "Documentos Administrativos";
  return "Todos";
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function ReportProcDoc({
  dados,
  total,
  filtros,
  meta,
  brasaoImgSrc,
  pagination,
}: {
  dados: Row[];
  total: number; // total real (count)
  filtros: Filtros;
  meta: { titulo: string; subtitulo?: string; geradoEmISO: string; usuario?: string };
  brasaoImgSrc?: string;
  pagination?: {
    page: number;
    pageSize: number;
    totalPages: number;
    makeHref: (page: number) => string;
  };
}) {
  const isTodos = !["processo_judicial","processo_administrativo","documento_administrativo"].includes(
    (filtros.tipo || "").toLowerCase()
  );

  const headerTitle =
    meta.subtitulo ?? (isTodos ? "Processos/Documentos" : tipoLabel(filtros.tipo));

  const from = pagination ? (pagination.page - 1) * pagination.pageSize + 1 : (dados.length ? 1 : 0);
  const to = pagination ? Math.min(pagination.page * pagination.pageSize, total) : dados.length;

  const hasPagination = !!pagination && pagination.totalPages > 1;

  return (
    <div className="mx-auto max-w-[760px] text-gray-900">
      {/* Cabeçalho (mantido) */}
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

        <h2 className="rounded bg-gray-100 text-2xl text-gray-600 font-semibold text-center pt-6 pb-4 mt-6">
          {headerTitle}
        </h2>
      </header>

      {/* Cards (mantidos) */}
      <section
        className="
          mb-4 grid grid-cols-1 gap-3 text-center text-xs
          sm:grid-cols-2 md:grid-cols-2 print:grid-cols-2
          no-break
        "
      >
        <div className="rounded border border-gray-200 p-3">
          <p className="text-gray-500">Tipo</p>
          <p className="mt-1 text-lg font-semibold">{tipoLabel(filtros.tipo)}</p>
        </div>

        <div className="rounded border border-gray-200 p-3">
          <p className="text-gray-500">Total de Itens</p>
          <p className="mt-1 text-lg font-semibold">
            {total.toLocaleString("pt-BR")}
          </p>
          {pagination ? (
            <p className="mt-1 text-[11px] text-gray-500">
              Mostrando {from.toLocaleString("pt-BR")}–{to.toLocaleString("pt-BR")}
            </p>
          ) : null}
        </div>
      </section>

      {/* Tabela (mantida) */}
      <section>
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-100">
            {isTodos ? (
              <tr className="text-left">
                <th className="px-4 py-2 font-medium text-gray-700">Caixa</th>
                <th className="px-4 py-2 font-medium text-gray-700">Classe Processual/Espécie Documental</th>
                <th className="px-4 py-2 font-medium text-gray-700">Nº Processo</th>
                <th className="px-4 py-2 font-medium text-gray-700">Protocolo</th>
                <th className="px-4 py-2 font-medium text-gray-700">Tipo</th>
              </tr>
            ) : filtros.tipo === "documento_administrativo" ? (
              <tr className="text-left">
                <th className="px-4 py-2 font-medium text-gray-700">Caixa</th>
                <th className="px-4 py-2 font-medium text-gray-700">Espécie Documental</th>
                <th className="px-4 py-2 font-medium text-gray-700">Data Limite</th>
              </tr>
            ) : (
              <tr className="text-left">
                <th className="px-4 py-2 font-medium text-gray-700">Caixa</th>
                <th className="px-4 py-2 font-medium text-gray-700">Classe Processual</th>
                <th className="px-4 py-2 font-medium text-gray-700">Nº Processo</th>
                <th className="px-4 py-2 font-medium text-gray-700">Protocolo</th>
              </tr>
            )}
          </thead>

          <tbody>
            {dados.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-3 text-sm text-gray-500"
                  colSpan={isTodos ? 5 : filtros.tipo === "documento_administrativo" ? 3 : 4}
                >
                  Nenhum registro encontrado com os filtros aplicados.
                </td>
              </tr>
            ) : isTodos ? (
              dados.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap px-4 py-2">{r.numero_caixa ?? "—"}</td>
                  <td className="px-4 py-2">
                    {r.classe_processual ?? r.especie_documental ?? "—"}
                  </td>
                  <td className="px-4 py-2">{r.numero_processo ?? "—"}</td>
                  <td className="px-4 py-2">{r.protocolo ?? "—"}</td>
                  <td className="px-4 py-2">
                    {r.tipo_item === "processo_judicial"
                      ? "Processo Judicial"
                      : r.tipo_item === "processo_administrativo"
                      ? "Processo Administrativo"
                      : "Documento Administrativo"}
                  </td>
                </tr>
              ))
            ) : (
              filtros.tipo === "documento_administrativo"
                ? dados.map((r) => (
                    <tr key={r.id}>
                      <td className="whitespace-nowrap px-4 py-2">{r.numero_caixa ?? "—"}</td>
                      <td className="px-4 py-2">{r.especie_documental ?? "—"}</td>
                      <td className="px-4 py-2">{r.data_limite ?? "—"}</td>
                    </tr>
                  ))
                : dados.map((r) => (
                    <tr key={r.id}>
                      <td className="whitespace-nowrap px-4 py-2">{r.numero_caixa ?? "—"}</td>
                      <td className="px-4 py-2">{r.classe_processual ?? "—"}</td>
                      <td className="px-4 py-2">{r.numero_processo ?? "—"}</td>
                      <td className="px-4 py-2">{r.protocolo ?? "—"}</td>
                    </tr>
                  ))
            )}
          </tbody>
        </table>
      </section>

      {/* Paginação (somente rodapé, igual à lista de caixas) */}
      {hasPagination && (
        <div className="mt-3 mb-0 flex items-center justify-end">
          <div className="inline-flex gap-1 text-sm">
            <a
              href={pagination!.makeHref(1)}
              className={`px-2 py-1 border rounded ${pagination!.page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-gray-50"}`}
              aria-label="Primeira"
            >
              «
            </a>
            <a
              href={pagination!.makeHref(clamp(pagination!.page - 1, 1, pagination!.totalPages))}
              className={`px-2 py-1 border rounded ${pagination!.page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-gray-50"}`}
              aria-label="Anterior"
            >
              ‹
            </a>
            <a
              href={pagination!.makeHref(clamp(pagination!.page + 1, 1, pagination!.totalPages))}
              className={`px-2 py-1 border rounded ${pagination!.page >= pagination!.totalPages ? "pointer-events-none opacity-40" : "hover:bg-gray-50"}`}
              aria-label="Próxima"
            >
              ›
            </a>
            <a
              href={pagination!.makeHref(pagination!.totalPages)}
              className={`px-2 py-1 border rounded ${pagination!.page >= pagination!.totalPages ? "pointer-events-none opacity-40" : "hover:bg-gray-50"}`}
              aria-label="Última"
            >
              »
            </a>
          </div>
        </div>
      )}

      <footer className="mt-6 text-center text-[10px] text-gray-500">
        Documento gerado pelo JudBox · {new Date(meta.geradoEmISO).toLocaleDateString("pt-BR")}
      </footer>

      <style>{`
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
