// app/relatorios/caixas/preview/page.tsx
import ReportListagem from "@/app/relatorios/_components/ReportListagem";
import ReportOverviewStatic from "@/app/relatorios/_components/ReportOverviewStatic";
import ReportProcDoc from "@/app/relatorios/_components/ReportProcDoc";

import { getOverviewData } from "@/lib/report/getOverviewData";
import { getCaixasData } from "@/lib/report/getCaixasData";
import { getProcDocData } from "@/lib/report/getProcDocData";

import { getUserServer } from "@/lib/auth/getUserServer";
import { getBrasaoDataURI } from "@/lib/brasao";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  kind?: "geral" | "listagem" | "por-tipo";
  tipo?: string | string[];
  numero?: string | string[];
  page?: string | string[];
  pageSize?: string | string[];
}>;

type Props = { searchParams: SearchParams };

function firstOrEmpty(v: string | string[] | undefined, fallback = ""): string {
  if (Array.isArray(v)) return v[0] ?? fallback;
  return v ?? fallback;
}
function parseIntSafe(v: string | undefined, def: number): number {
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : def;
}

export default async function PreviewPage({ searchParams }: Props) {
  const sp = await searchParams;

  const { user } = await getUserServer();
  if (!user) return <div className="p-6 text-sm text-gray-700">Não autenticado</div>;

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

  if (kind === "por-tipo") {
    // paginação (1-based)
    const page = parseIntSafe(firstOrEmpty(sp.page, ""), 1);
    const pageSize = parseIntSafe(firstOrEmpty(sp.pageSize, ""), 50);

    const { data, count } = await getProcDocData({
      tipo: (["todos","processo_judicial","processo_administrativo","documento_administrativo"].includes(
        tipo
      )
        ? (tipo as any)
        : "todos"),
      numero,
      page,
      pageSize,
    });

    const total = count ?? data.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const makeHref = (targetPage: number) => {
      const p = new URLSearchParams();
      p.set("kind", "por-tipo");
      p.set("tipo", tipo || "todos");
      p.set("numero", numero || "");
      p.set("page", String(targetPage));
      p.set("pageSize", String(pageSize));
      return `/relatorios/caixas/preview?${p.toString()}`;
    };

    return (
      <div className="bg-white">
        <ReportProcDoc
          dados={data}
          total={total}
          filtros={{ tipo, numero }}
          meta={{
            titulo: "10ª Zona Eleitoral - Guarabira",
            subtitulo: "Processos/Documentos",
            geradoEmISO: new Date().toISOString(),
            usuario: user.email ?? undefined,
          }}
          brasaoImgSrc={brasaoImgSrc}
          pagination={{
            page,
            pageSize,
            totalPages,
            makeHref,
          }}
        />
      </div>
    );
  }

  // kind === "listagem"
  const isTodos = (tipo || "").toLowerCase() === "todos";

  if (isTodos) {
    // ✅ paginação só quando tipo = "todos"
    const page = parseIntSafe(firstOrEmpty(sp.page, ""), 1);
    const pageSize = parseIntSafe(firstOrEmpty(sp.pageSize, ""), 50);

    // dados paginados para a tabela
    const { data, count } = await getCaixasData({ tipo, numero, page, pageSize });

    // contagens REAIS por tipo (consulta leve: pageSize 1, usamos apenas o count)
    const [jud, adm, doc] = await Promise.all([
      getCaixasData({ tipo: "processo_judicial", numero, page: 1, pageSize: 1 }),
      getCaixasData({ tipo: "processo_administrativo", numero, page: 1, pageSize: 1 }),
      getCaixasData({ tipo: "documento_administrativo", numero, page: 1, pageSize: 1 }),
    ]);

    const stats = {
      all: (jud.count ?? 0) + (adm.count ?? 0) + (doc.count ?? 0),
      jud: jud.count ?? 0,
      adm: adm.count ?? 0,
      doc: doc.count ?? 0,
    };

    const total = count ?? data.length; // total para a tabela (filtro "todos")
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const makeHref = (targetPage: number) => {
      const p = new URLSearchParams();
      p.set("kind", "listagem");
      p.set("tipo", tipo || "todos");
      p.set("numero", numero || "");
      p.set("page", String(targetPage));
      p.set("pageSize", String(pageSize));
      return `/relatorios/caixas/preview?${p.toString()}`;
    };

    return (
      <div className="bg-white">
        <ReportListagem
          dados={data}
          filtros={{ tipo, numero }}
          meta={{
            titulo: "10ª Zona Eleitoral - Guarabira",
            subtitulo: "Listagem completa",
            geradoEmISO: new Date().toISOString(),
            usuario: user.email ?? undefined,
          }}
          brasaoImgSrc={brasaoImgSrc}
          pagination={{
            page,
            pageSize,
            total,
            totalPages,
            makeHref,
          }}
          stats={stats} // 👈 totais reais para os cards no filtro "todos"
        />
      </div>
    );
  }

  // Demais tipos (sem paginação)
  const { data } = await getCaixasData({ tipo, numero });
  return (
    <div className="bg-white">
      <ReportListagem
        dados={data}
        filtros={{ tipo, numero }}
        meta={{
          titulo: "10ª Zona Eleitoral - Guarabira",
          subtitulo: "Listagem completa",
          geradoEmISO: new Date().toISOString(),
          usuario: user.email ?? undefined,
        }}
        brasaoImgSrc={brasaoImgSrc}
      />
    </div>
  );
}
