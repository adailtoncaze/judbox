// app/relatorios/caixas/preview/page.tsx
import { redirect } from "next/navigation";
import { getCaixasData } from "@/lib/report/getCaixasData";
import ReportListagem from "@/app/relatorios/_components/ReportListagem";
import ReportOverview from "@/app/relatorios/_components/ReportOverview";
import { getUserServer } from "@/lib/auth/getUserServer";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; tipo?: string; numero?: string }>;
}) {
  const { user } = await getUserServer();
  if (!user) redirect("/login");

  // Next 15: searchParams é Promise
  const sp = await searchParams;
  const kind = (sp?.kind ?? "listagem") as "geral" | "listagem" | "por-tipo";
  const tipo = sp?.tipo ?? "todos";
  const numero = sp?.numero ?? "";

  if (kind === "geral") {
    return (
      <main className="p-6">
        <ReportOverview />
      </main>
    );
  }

  const { data: dados } = await getCaixasData({
    tipo: kind === "por-tipo" ? tipo : tipo,
    numero,
  });

  return (
    <main className="p-6">
      <ReportListagem
        dados={dados}
        filtros={{ tipo: kind === "por-tipo" ? tipo : tipo, numero }}
        meta={{
          titulo: kind === "por-tipo" ? "Relatório por Tipo" : "Relatório de Caixas",
          subtitulo: kind === "por-tipo" ? `Tipo: ${tipo}` : "Listagem completa",
          geradoEmISO: new Date().toISOString(),
          usuario: user.email ?? undefined,
        }}
      />
    </main>
  );
}
