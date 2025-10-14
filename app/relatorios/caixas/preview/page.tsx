// app/relatorios/caixas/preview/page.tsx
import ReportListagem from "@/app/relatorios/_components/ReportListagem";
import ReportOverviewStatic from "@/app/relatorios/_components/ReportOverviewStatic";
import { getOverviewData } from "@/lib/report/getOverviewData";
import { getCaixasData } from "@/lib/report/getCaixasData";
import { getUserServer } from "@/lib/auth/getUserServer";
import { getBrasaoDataURI } from "@/lib/brasao";

export const dynamic = "force-dynamic";

// Tipos do Next 15: searchParams é Promise
type SearchParams = Promise<{
  kind?: "geral" | "listagem" | "por-tipo";
  tipo?: string | string[];
  numero?: string | string[];
}>;

type Props = {
  searchParams: SearchParams;
};

function firstOrEmpty(v: string | string[] | undefined, fallback = ""): string {
  if (Array.isArray(v)) return v[0] ?? fallback;
  return v ?? fallback;
}

export default async function PreviewPage({ searchParams }: Props) {
  // 👇 Agora aguardamos os params
  const sp = await searchParams;

  const { user } = await getUserServer();
  if (!user) {
    return <div className="p-6 text-sm text-gray-700">Não autenticado</div>;
  }

  const kind = (sp.kind ?? "listagem") as "geral" | "listagem" | "por-tipo";
  const tipo = firstOrEmpty(sp.tipo, "todos");
  const numero = firstOrEmpty(sp.numero, "");

  const brasaoImgSrc = await getBrasaoDataURI();

  if (kind === "geral") {
    const m = await getOverviewData();
    return (
      <div className="bg-white">
        <ReportOverviewStatic
          header={{
            titulo: "10ª Zona Eleitoral - Guarabira",
            geradoEmISO: new Date().toISOString(),
            usuario: m.usuario,
            brasaoImgSrc,
          }}
          totalCaixas={m.totalCaixas}
          destPreservar={m.destPreservar}
          destEliminar={m.destEliminar}
          pTot={m.pTot}
          pJud={m.pJud}
          pAdm={m.pAdm}
          docsAdm={m.docsAdm}
          cxJud={m.cxJud}
          cxAdm={m.cxAdm}
          cxDoc={m.cxDoc}
        />
      </div>
    );
  }

  const { data } = await getCaixasData({ tipo, numero });

  return (
    <div className="bg-white">
      <ReportListagem
        dados={data}
        filtros={{ tipo, numero }}
        meta={{
          titulo: "10ª Zona Eleitoral - Guarabira",
          subtitulo: kind === "por-tipo" ? `Tipo: ${tipo}` : "Listagem completa",
          geradoEmISO: new Date().toISOString(),
          usuario: user.email ?? undefined,
        }}
        brasaoImgSrc={brasaoImgSrc}
      />
    </div>
  );
}
