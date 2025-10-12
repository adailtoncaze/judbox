// app/relatorios/caixas/preview/page.tsx
import { getUserServer } from "@/lib/auth/getUserServer";
import { getBrasaoDataURI } from "@/lib/brasao";
import ReportListagem from "@/app/relatorios/_components/ReportListagem";
import ReportOverview from "@/app/relatorios/_components/ReportOverview";
import { getCaixasData } from "@/lib/report/getCaixasData";

type Kind = "geral" | "listagem" | "por-tipo";

const TITLE = "10ª Zona Eleitoral - Guarabira";

export default async function PreviewPage({
  searchParams,
}: {
  // Em alguns setups o Next entrega searchParams como Promise
  searchParams: Promise<{ kind?: Kind; tipo?: string; numero?: string }>;
}) {
  const sp = await searchParams;
  const kind: Kind = (sp?.kind as Kind) || "listagem";
  const tipo = sp?.tipo ?? "todos";
  const numero = sp?.numero ?? "";

  const { user } = await getUserServer();
  const brasaoImgSrc = await getBrasaoDataURI(); // pré-carrega brasão para o preview também

  if (kind === "geral") {
    // Relatório Geral
    return (
      <div className="mx-auto max-w-[900px] text-gray-900 overflow-x-hidden print:overflow-visible">
        {/* 👇 Respiro só no preview */}
        <div className="pt-6 pb-10 md:pt-8 md:pb-14">
          <ReportOverview brasaoImgSrc={brasaoImgSrc} />
        </div>
      </div>
    );
  }

  // Listagem e Por Tipo reutilizam o mesmo componente
  const { data } = await getCaixasData({ tipo, numero });

  const meta = {
    titulo: TITLE, // título fixo no header do relatório
    subtitulo: kind === "por-tipo" ? `Tipo: ${tipo || "—"}` : "Listagem completa",
    geradoEmISO: new Date().toISOString(),
    usuario: user?.email ?? undefined,
  };

  return (
    <div className="mx-auto max-w-[900px] text-gray-900 overflow-x-hidden print:overflow-visible">
      {/* 👇 Respiro só no preview */}
      <div className="pt-6 pb-10 md:pt-8 md:pb-14">
        <ReportListagem
          dados={data}
          filtros={{ tipo, numero }}
          meta={meta}
          brasaoImgSrc={brasaoImgSrc}
        />
      </div>
    </div>
  );
}
