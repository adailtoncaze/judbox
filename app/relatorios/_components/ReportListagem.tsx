// app/relatorios/_components/ReportListagem.tsx
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

// Wrapper fino para reutilizar seu componente existente
export default function ReportListagem({
  dados,
  filtros,
  meta,
}: {
  dados: Caixa[];
  filtros: Filtros;
  meta: Meta;
}) {
  return <ReportHTML dados={dados} filtros={filtros} meta={meta} />;
}
