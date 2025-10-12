// app/relatorios/caixas/_ReportHTML.tsx
type Caixa = {
  id: string;
  numero_caixa: string; // ← usar o nome real
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
}: {
  dados: Caixa[];
  filtros: Filtros;
  meta: Meta;
}) {
  return (
    <div className="mx-auto max-w-[760px] text-gray-900">
      {/* Cabeçalho */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-600" />
            <div>
              <h1 className="text-xl font-semibold">{meta.titulo}</h1>
              <p className="text-xs text-gray-600">{meta.subtitulo ?? "Relatório gerado pelo JudBox"}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600">
              Gerado em: {new Date(meta.geradoEmISO).toLocaleString("pt-BR")}
            </p>
            {meta.usuario && <p className="text-xs text-gray-600">Usuário: {meta.usuario}</p>}
          </div>
        </div>

        {/* Filtros */}
        <div className="mt-4 rounded-xl border border-gray-200 p-3 text-xs">
          <span className="font-medium">Filtros:</span>{" "}
          {[
            filtros.tipo ? `Tipo=${filtros.tipo}` : "Tipo=Todos",
            filtros.numero ? `Caixa=${filtros.numero}` : "Caixa=—",
          ].join(" · ")}
        </div>
      </header>

      {/* Sumário simples */}
      <section className="mb-4 grid grid-cols-3 gap-3 text-center text-xs">
        <div className="rounded-lg border border-gray-200 p-3">
          <p className="text-gray-500">Total de caixas</p>
          <p className="mt-1 text-lg font-semibold">{dados.length}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-3">
          <p className="text-gray-500">Com descrição</p>
          <p className="mt-1 text-lg font-semibold">
            {dados.filter((c) => (c.descricao ?? "").trim() !== "").length}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 p-3">
          <p className="text-gray-500">Local padrão</p>
          <p className="mt-1 text-lg font-semibold">
            {dados.filter((c) => (c.localizacao ?? "") === "Guarabira").length}
          </p>
        </div>
      </section>

      {/* Tabela */}
      <section className="rounded-xl border border-gray-200">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium text-gray-700"># Caixa</th>
              <th className="px-4 py-3 font-medium text-gray-700">Tipo</th>
              <th className="px-4 py-3 font-medium text-gray-700">Localização</th>
              <th className="px-4 py-3 font-medium text-gray-700">Destinação</th>
              <th className="px-4 py-3 font-medium text-gray-700">Descrição</th>
            </tr>
          </thead>
          <tbody>
            {dados.map((c) => (
              <tr key={c.id} className="odd:bg-white even:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3">{c.numero_caixa}</td>
                <td className="px-4 py-3">{c.tipo}</td>
                <td className="px-4 py-3">{c.localizacao || "—"}</td>
                <td className="px-4 py-3">{c.destinacao || "—"}</td>
                <td className="px-4 py-3">{c.descricao || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer className="mt-6 text-center text-[10px] text-gray-500">
        Documento gerado pelo JudBox · {new Date(meta.geradoEmISO).toLocaleDateString("pt-BR")}
      </footer>

      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print { .no-print { display: none !important; } }
        section, header, footer, table, tr, td, th { break-inside: avoid; page-break-inside: avoid; }
      `}</style>
    </div>
  );
}
