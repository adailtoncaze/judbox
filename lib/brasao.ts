// lib/brasao.ts
import path from "node:path";
import { promises as fs } from "node:fs";

let Sharp: typeof import("sharp") | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Sharp = require("sharp");
} catch {
  Sharp = null;
}

function cleanSvg(svg: string) {
  if (!svg) return svg;
  return svg
    .replace(/<\?xml[\s\S]*?\?>/gi, "")
    .replace(/<!DOCTYPE[\s\S]*?>/gi, "")
    .replace(/<title>[\s\S]*?<\/title>/gi, "")
    .replace(/\s(width|height)="[^"]*"/gi, "")
    .replace(/image-rendering:\s*pixelated;?/gi, "");
}

export async function getBrasaoDataURI(): Promise<string> {
  const brasaoPath = path.join(process.cwd(), "public", "brasao.svg");
  try {
    const svgRaw = await fs.readFile(brasaoPath, "utf8");
    if (Sharp) {
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
    }
    // fallback SVG (menos consistente em alguns PDF engines)
    const cleaned = cleanSvg(svgRaw);
    return `data:image/svg+xml;utf8,${encodeURIComponent(
      cleaned.replace(
        /<svg\b([^>]*)>/i,
        (_m, attrs) =>
          `<svg${attrs} width="64" height="64" preserveAspectRatio="xMidYMid meet" shape-rendering="geometricPrecision" text-rendering="geometricPrecision">`
      )
    )}`;
  } catch {
    return "";
  }
}
