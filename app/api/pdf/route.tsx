// app/api/pdf/route.ts
import { NextRequest, NextResponse } from "next/server";
import chromium from "@sparticuz/chromium";
import puppeteerCore from "puppeteer-core";

import ReportListagem from "@/app/relatorios/_components/ReportListagem";
import ReportOverviewStatic from "@/app/relatorios/_components/ReportOverviewStatic";
import { getOverviewData } from "@/lib/report/getOverviewData";

import { getCaixasData } from "@/lib/report/getCaixasData";
import { getUserServer } from "@/lib/auth/getUserServer";
import { getBrasaoDataURI } from "@/lib/brasao";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// --- util: gera Buffer de PDF a partir de kind/filters ---
async function generatePdfBuffer({
  kind,
  filters,
  userEmail,
  brasaoImgSrc,
}: {
  kind: "geral" | "listagem" | "por-tipo";
  filters: { tipo?: string | null; numero?: string | null };
  userEmail: string | undefined | null;
  brasaoImgSrc: string;
}) {
  const { renderToStaticMarkup } = await import("react-dom/server");
  let bodyHTML = "";

  if (kind === "geral") {
    const m = await getOverviewData();
    bodyHTML = renderToStaticMarkup(
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
    );
  } else {
    const { data } = await getCaixasData({
      tipo: filters?.tipo ?? null,
      numero: filters?.numero ?? null,
    });

    bodyHTML = renderToStaticMarkup(
      <ReportListagem
        dados={data}
        filtros={{
          tipo: filters?.tipo ?? "todos",
          numero: filters?.numero ?? "",
        }}
        meta={{
          titulo: "10ª Zona Eleitoral - Guarabira",
          subtitulo: kind === "por-tipo" ? `Tipo: ${filters?.tipo ?? "—"}` : "Listagem completa",
          geradoEmISO: new Date().toISOString(),
          usuario: userEmail ?? undefined,
        }}
        brasaoImgSrc={brasaoImgSrc}
      />
    );
  }

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>${bodyHTML}</body>
</html>`;

  const isDev = process.env.NODE_ENV !== "production";
  const puppeteer = isDev ? (await import("puppeteer")).default : puppeteerCore;

  const executablePath = isDev
    ? await (puppeteer as any).executablePath()
    : (await chromium.executablePath()) || process.env.PUPPETEER_EXECUTABLE_PATH;

  const browser = await puppeteer.launch({
    args: isDev ? [] : [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox"],
    executablePath,
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfRaw = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="
          font-size:10px;
          width:100%;
          padding:0 10mm;
          padding-bottom:1mm;
          display:flex;
          justify-content:space-between;
          align-items:center;
        ">
          <span>JudBox • ${kind === "geral" ? "Relatório Geral" : kind === "por-tipo" ? "Relatório por Tipo" : "Relatório de Caixas"}</span>
          <span class="date"></span>
        </div>`,
      footerTemplate: `
        <div style="
          font-size:10px;
          width:100%;
          padding:0 10mm;
          display:flex;
          justify-content:space-between;
          align-items:center;
        ">
          <span>Usuário: ${userEmail ?? "—"}</span>
          <span>Página <span class="pageNumber"></span> / <span class="totalPages"></span></span>
        </div>`,
      margin: { top: "20mm", bottom: "20mm", left: "10mm", right: "10mm" },
    });

    // normaliza em ArrayBuffer puro (NextResponse aceita Buffer/TypedArray também)
    const uint8 = pdfRaw instanceof Uint8Array ? pdfRaw : new Uint8Array(pdfRaw as any);
    const pureAB = new ArrayBuffer(uint8.byteLength);
    new Uint8Array(pureAB).set(uint8);
    return pureAB;
  } finally {
    await browser.close();
  }
}

// -------------------- GET (pré-visualização inline) --------------------
export async function GET(req: NextRequest) {
  const { user } = await getUserServer();
  if (!user) return new NextResponse("Não autenticado", { status: 401 });

  const brasaoImgSrc = await getBrasaoDataURI();

  const { searchParams } = new URL(req.url);
  const kind = (searchParams.get("kind") || "listagem") as "geral" | "listagem" | "por-tipo";
  const filters =
    kind === "geral"
      ? {}
      : {
          tipo: searchParams.get("tipo") || "todos",
          numero: searchParams.get("numero") || "",
        };

  const inline = searchParams.get("inline") === "1";
  const filename = "judbox-relatorio.pdf";

  const pdfAB = await generatePdfBuffer({
    kind,
    filters,
    userEmail: user.email,
    brasaoImgSrc,
  });

  return new NextResponse(pdfAB, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": inline
        ? `inline; filename="${filename}"`
        : `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

// -------------------- POST (download - mantém seu fluxo) --------------------
export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  let kind: "geral" | "listagem" | "por-tipo" = "listagem";
  let filters: any = {};

  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => ({} as any));
    kind = (body?.kind ?? "listagem") as any;
    filters = body?.filters ?? {};
  } else {
    const form = await req.formData().catch(() => null);
    kind = ((form?.get("kind") as string) || "listagem") as any;
    filters = {
      tipo: (form?.get("tipo") as string) || "todos",
      numero: (form?.get("numero") as string) || "",
    };
  }

  const { user } = await getUserServer();
  if (!user) return new NextResponse("Não autenticado", { status: 401 });

  const brasaoImgSrc = await getBrasaoDataURI();
  const pdfAB = await generatePdfBuffer({
    kind,
    filters,
    userEmail: user.email,
    brasaoImgSrc,
  });

  return new NextResponse(pdfAB, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="judbox-relatorio.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
