import ReportHTML from "@/app/relatorios/caixas/_ReportHTML";

// Tipos opcionais — ajuste se já tiver tipos próprios
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
  total: number;        // total real (do filtro atual)
  totalPages: number;
  makeHref: (page: number) => string;
};

type Stats = {
  all: number; // total de caixas (todos os tipos) para o filtro "todos"
  jud: number; // processos judiciais
  adm: number; // processos administrativos
  doc: number; // documentos administrativos
};

type Props = {
  dados: Caixa[];
  filtros: Filtros;
  meta: Meta;
  brasaoImgSrc?: string;
  pagination?: Pagination;
  stats?: Stats;        // 👈 NOVO
};

export default function ReportListagem({
  dados,
  filtros,
  meta,
  brasaoImgSrc,
  pagination,
  stats,
}: Props) {
  return (
    <ReportHTML
      dados={dados}
      filtros={filtros}
      meta={meta}
      brasaoImgSrc={brasaoImgSrc}
      pagination={pagination}
      stats={stats} // 👈 repassa
    />
  );
}
