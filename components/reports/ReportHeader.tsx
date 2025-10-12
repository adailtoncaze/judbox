// components/reports/ReportHeader.tsx
import path from "node:path";
import { promises as fs } from "node:fs";

// importa sharp de forma segura (não quebra build se não tiver instalado)
let Sharp: typeof import("sharp") | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Sharp = require("sharp");
} catch {
  Sharp = null;
}

export type ReportHeaderMeta = {
  titulo: string;
  geradoEmISO: string;   // ex.: new Date().toISOString()
  usuario?: string | null;
  /** Permite override opcional do brasão (Data URI ou URL). Se não vier, calculamos localmente. */
  brasaoImgSrc?: string;
};

// fallback caso sharp não esteja disponível
function cleanSvg(svg: string) {
  if (!svg) return svg;
  return svg
    .replace(/<\?xml[\s\S]*?\?>/gi, "")
    .replace(/<!DOCTYPE[\s\S]*?>/gi, "")
    .replace(/<title>[\s\S]*?<\/title>/gi, "")
    .replace(/\s(width|height)="[^"]*"/gi, "")
    .replace(/image-rendering:\s*pixelated;?/gi, "");
}

async function getBrasaoDataURI() {
  const brasaoPath = path.join(process.cwd(), "public", "brasao.svg");
  try {
    const svgRaw = await fs.readFile(brasaoPath, "utf8");
    if (Sharp) {
      // PNG nítido (rasteriza grande e exibimos menor)
      const pngBuf = await Sharp(Buffer.from(svgRaw))
        .resize(192, 192, {
          fit: "cover",
          position: "centre",
          withoutEnlargement: false,
          kernel: "lanczos3",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png({ compressionLevel: 9, adaptiveFiltering: true, palette: true, quality: 100 })
        .toBuffer();
      return `data:image/png;base64,${pngBuf.toString("base64")}`;
    } else {
      const cleaned = cleanSvg(svgRaw);
      return `data:image/svg+xml;utf8,${encodeURIComponent(
        cleaned.replace(
          /<svg\b([^>]*)>/i,
          (_m, attrs) =>
            `<svg${attrs} width="64" height="64" preserveAspectRatio="xMidYMid meet" shape-rendering="geometricPrecision" text-rendering="geometricPrecision">`
        )
      )}`;
    }
  } catch {
    return "";
  }
}

/**
 * Header reutilizável para PDF/HTML (server component).
 * Use: {await ReportHeader({ titulo, geradoEmISO, usuario, brasaoImgSrc? })}
 */
export async function ReportHeader(meta: ReportHeaderMeta) {
  // Se vier por meta, usa; senão, calcula localmente como antes (comportamento preservado)
  const brasaoImgSrc = meta.brasaoImgSrc ?? (await getBrasaoDataURI());

  return (
    <header className="mb-6">
      {/* Bloco: brasão + textos (alinhados) */}
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

      {/* Linha sutil abaixo */}
      <div className="mt-2 border-b border-gray-200/70 print:border-gray-300/80" />
    </header>
  );
}
