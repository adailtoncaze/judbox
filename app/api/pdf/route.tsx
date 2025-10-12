// app/api/pdf/route.ts
import { NextRequest } from "next/server";
import chromium from "@sparticuz/chromium";
import puppeteerCore from "puppeteer-core";
import ReportListagem from "@/app/relatorios/_components/ReportListagem";
import ReportOverview from "@/app/relatorios/_components/ReportOverview";
import { getCaixasData } from "@/lib/report/getCaixasData";
import { getUserServer } from "@/lib/auth/getUserServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  if (!user) return new Response("Não autenticado", { status: 401 });

  // Render HTML conforme o tipo
  const { renderToStaticMarkup } = await import("react-dom/server");
  let bodyHTML = "";

  if (kind === "geral") {
    bodyHTML = renderToStaticMarkup(await ReportOverview());
  } else {
    const { data } = await getCaixasData({
      tipo: kind === "por-tipo" ? filters?.tipo ?? null : filters?.tipo ?? null,
      numero: filters?.numero ?? null,
    });

    bodyHTML = renderToStaticMarkup(
      <ReportListagem
        dados={data}
        filtros={{ tipo: kind === "por-tipo" ? (filters?.tipo ?? "todos") : (filters?.tipo ?? "todos"), numero: filters?.numero ?? "" }}
        meta={{
          titulo: kind === "por-tipo" ? "Relatório por Tipo" : "Relatório de Caixas",
          subtitulo: kind === "por-tipo" ? `Tipo: ${filters?.tipo ?? "—"}` : "Listagem completa",
          geradoEmISO: new Date().toISOString(),
          usuario: user.email ?? undefined,
        }}
      />
    );
  }

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @page { size: A4; margin: 12mm; }
    section, header, footer, table, tr, td, th { break-inside: avoid; page-break-inside: avoid; }
    html, body { background: white; }
  </style>
</head>
<body>${bodyHTML}</body>
</html>`;

  const isDev = process.env.NODE_ENV !== "production";
  const puppeteer = isDev ? (await import("puppeteer")).default : puppeteerCore;

  const executablePath = isDev
    ? await puppeteer.executablePath()
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
        <div style="font-size:10px;width:100%;padding:0 12mm;display:flex;justify-content:space-between;">
          <span>JudBox • ${kind === "geral" ? "Relatório Geral" : kind === "por-tipo" ? "Relatório por Tipo" : "Relatório de Caixas"}</span>
          <span class="date"></span>
        </div>`,
      footerTemplate: `
        <div style="font-size:10px;width:100%;padding:0 12mm;display:flex;justify-content:space-between;">
          <span>Usuário: ${user.email ?? "—"}</span>
          <span>Página <span class="pageNumber"></span> / <span class="totalPages"></span></span>
        </div>`,
      margin: { top: "18mm", bottom: "14mm", left: "12mm", right: "12mm" },
    });

    const uint8 = pdfRaw instanceof Uint8Array ? pdfRaw : new Uint8Array(pdfRaw as any);
    const pureAB = new ArrayBuffer(uint8.byteLength);
    new Uint8Array(pureAB).set(uint8);

    return new Response(pureAB, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="judbox-relatorio.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } finally {
    await browser.close();
  }
}
