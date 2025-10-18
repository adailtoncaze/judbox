// app/api/export/csv/route.ts
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export const runtime = "nodejs";        // ✅ valor aceito: 'edge' | 'nodejs'
export const dynamic = "force-dynamic"; // evita cache agressivo (importante p/ CSV grande)

const PAGE_SIZE = 1000;

// ---------- Utils ----------
function chunk<T>(arr: T[], size = PAGE_SIZE): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
function q(v: unknown): string {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

// numero_caixa -> destinacao (com chunking)
async function buildDestMapByNumeroCaixa(
  supabase: ReturnType<typeof createServerClient>,
  numeros: string[]
): Promise<Record<string, string>> {
  const uniques = Array.from(new Set(numeros.filter(Boolean).map((n) => n.trim())));
  if (uniques.length === 0) return {};
  const map: Record<string, string> = {};
  for (const part of chunk(uniques, 800)) {
    const { data, error } = await supabase
      .from("caixas")
      .select("numero_caixa, destinacao")
      .in("numero_caixa", part);
    if (error) throw error;
    (data ?? []).forEach((c: any) => {
      if (c?.numero_caixa) map[c.numero_caixa] = c.destinacao ?? "";
    });
  }
  return map;
}

// ---------- Handler ----------
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const tipo = (url.searchParams.get("tipo") || "").toLowerCase(); // documentos_adm | processos_jud | processos_adm

  if (!["documentos_adm", "processos_jud", "processos_adm"].includes(tipo)) {
    return new Response("Parâmetro 'tipo' inválido.", { status: 400 });
  }

  // Supabase SSR com cookies() assíncrono — respeita RLS
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value ?? undefined;
        },
        set(name: string, value: string, options: CookieOptions) {
          const { domain, maxAge, path, sameSite, expires, httpOnly, secure } = options || {};
          cookieStore.set(name, value, {
            domain,
            maxAge,
            path,
            sameSite: sameSite as any,
            expires,
            httpOnly,
            secure,
          });
        },
        remove(name: string, options: CookieOptions) {
          const { domain, path, sameSite, secure } = options || {};
          cookieStore.set(name, "", {
            domain,
            path,
            sameSite: sameSite as any,
            secure,
            maxAge: 0,
          });
        },
      },
    }
  );

  const filename = `${tipo}.csv`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // BOM UTF-8 p/ Excel
      controller.enqueue(new Uint8Array([0xef, 0xbb, 0xbf]));

      try {
        if (tipo === "documentos_adm") {
          controller.enqueue(
            encoder.encode(
              "Espécie Documental,Data Limite,Quantidade de Caixas,Número das Caixas,Destinação,Observação\n"
            )
          );

          for (let from = 0; ; from += PAGE_SIZE) {
            const to = from + PAGE_SIZE - 1;
            const { data, error } = await supabase
              .from("documentos_adm")
              .select("*")
              .range(from, to);

            if (error) throw error;
            if (!data || data.length === 0) break;

            const numeros = new Set<string>();
            data.forEach((d: any) => {
              String(d.numero_caixas ?? "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .forEach((n) => numeros.add(n));
            });
            const destMap = await buildDestMapByNumeroCaixa(supabase, Array.from(numeros));

            for (const d of data) {
              const nums = String(d.numero_caixas ?? "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
              const destinacoes = Array.from(new Set(nums.map((n) => destMap[n]).filter(Boolean))).join(
                "; "
              );

              const line = [
                q(d.especie_documental),
                q(d.data_limite),
                q(d.quantidade_caixas),
                q(d.numero_caixas),
                q(destinacoes),
                q(d.observacao ?? ""),
              ].join(",") + "\n";

              controller.enqueue(encoder.encode(line));
            }

            if (data.length < PAGE_SIZE) break;
          }
        }

        if (tipo === "processos_jud" || tipo === "processos_adm") {
          controller.enqueue(
            encoder.encode(
              "Nº da Caixa,Tipo de Processo,Nº do Processo,Protocolo,Ano,Quantidade de Volumes,Nº de Caixas,Destinação,Observação\n"
            )
          );

          const filtroTipo =
            tipo === "processos_jud" ? "processo_judicial" : "processo_administrativo";
          const columns = `
            id,
            numero_processo,
            protocolo,
            ano,
            quantidade_volumes,
            numero_caixas,
            observacao,
            classe_processual,
            caixas!inner (numero_caixa, tipo, destinacao)
          `;

          for (let from = 0; ; from += PAGE_SIZE) {
            const to = from + PAGE_SIZE - 1;
            const { data, error } = await supabase
              .from("processos")
              .select(columns)
              .eq("caixas.tipo", filtroTipo)
              .range(from, to);

            if (error) throw error;
            if (!data || data.length === 0) break;

            const numeros = Array.from(
              new Set((data as any[]).map((p) => p?.caixas?.numero_caixa).filter(Boolean))
            ) as string[];
            const destMap = await buildDestMapByNumeroCaixa(supabase, numeros);

            for (const p of data as any[]) {
              const numCx = p?.caixas?.numero_caixa ?? "";
              const destinacao = p?.caixas?.destinacao ?? (numCx ? destMap[numCx] ?? "" : "");

              const line = [
                q(numCx),
                q(p.classe_processual ?? ""),
                q(p.numero_processo ?? ""),
                q(p.protocolo ?? ""),
                q(p.ano ?? ""),
                q(p.quantidade_volumes ?? ""),
                q(p.numero_caixas ?? ""),
                q(destinacao),
                q(p.observacao ?? ""),
              ].join(",") + "\n";

              controller.enqueue(encoder.encode(line));
            }

            if (data.length < PAGE_SIZE) break;
          }
        }

        controller.close();
      } catch (err: any) {
        controller.enqueue(encoder.encode(`\n# ERRO: ${err?.message || String(err)}\n`));
        controller.close();
      }
    },
  });

  const headers = new Headers();
  headers.set("Content-Type", "text/csv; charset=utf-8");
  headers.set("Content-Disposition", `attachment; filename="${filename}"`);
  headers.set("Cache-Control", "no-store");

  return new Response(stream, { headers });
}
