import AdminShell from "@/components/admin/admin-shell";
import { AdminReportsClient } from "@/components/admin/admin-reports-client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatReportDate, type ChartDatum, type ReportsData } from "@/lib/reports";

function groupCount<T>(items: T[], getKey: (item: T) => string) {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = getKey(item);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function getLastDays(daysCount: number) {
  return Array.from({ length: daysCount }).map((_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (daysCount - index - 1));
    return {
      key: date.toISOString().slice(0, 10),
      name: date.toLocaleDateString("es-AR", { weekday: "short", day: "2-digit" }),
    };
  });
}

export default async function AdminReportsPage() {
  await requireAdmin();

  const lastDays = getLastDays(14);
  const firstDay = new Date();
  firstDay.setHours(0, 0, 0, 0);
  firstDay.setDate(firstDay.getDate() - 13);

  const [queries, usersCount, branchesCount, activeHealthInsurancesCount, documentsCount] = await Promise.all([
    prisma.query.findMany({
      where: { createdAt: { gte: firstDay } },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true } },
        branch: { select: { name: true } },
        detectedHealthInsurance: { select: { name: true } },
      },
    }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.branch.count({ where: { isActive: true } }),
    prisma.healthInsurance.count({ where: { isActive: true } }),
    prisma.document.count({ where: { isActive: true } }),
  ]);

  const totalQueries = queries.length;
  const withResponse = queries.filter((query: any) => query.resultFound).length;
  const withoutResponse = totalQueries - withResponse;
  const responseRate = totalQueries > 0 ? Math.round((withResponse / totalQueries) * 100) : 0;

  const queriesByDay: ChartDatum[] = lastDays.map((day) => ({
    name: day.name,
    value: queries.filter((query: any) => query.createdAt.toISOString().slice(0, 10) === day.key).length,
  }));

  const data: ReportsData = {
    kpis: [
      { label: "Consultas", value: String(totalQueries), detail: "Consultas registradas en los últimos 14 días." },
      { label: "Con respuesta", value: `${responseRate}%`, detail: `${withResponse} con respuesta y ${withoutResponse} sin respuesta suficiente.` },
      { label: "Obras sociales", value: String(activeHealthInsurancesCount), detail: "Obras sociales activas para consulta." },
      { label: "Normativas", value: String(documentsCount), detail: "Documentos normativos activos cargados." },
      { label: "Usuarios", value: String(usersCount), detail: "Usuarios activos en el sistema." },
      { label: "Sucursales", value: String(branchesCount), detail: "Sucursales activas registradas." },
    ],
    queriesByDay,
    queriesByBranch: groupCount(queries as any[], (query: any) => query.branch?.name ?? "Sin sucursal").slice(0, 8),
    queriesByHealthInsurance: groupCount(queries as any[], (query: any) => query.detectedHealthInsurance?.name ?? "No detectada").slice(0, 8),
    responseStatus: [
      { name: "Con respuesta", value: withResponse },
      { name: "Sin respuesta", value: withoutResponse },
    ].filter((item) => item.value > 0),
    latestQueries: queries.slice(0, 20).map((query: any) => ({
      id: query.id,
      text: query.originalText,
      userName: query.user?.name ?? "Usuario",
      branchName: query.branch?.name ?? "Sin sucursal",
      healthInsuranceName: query.detectedHealthInsurance?.name ?? "No detectada",
      resultFound: query.resultFound,
      topScore: query.topScore,
      createdAt: formatReportDate(query.createdAt),
    })),
  };

  return (
    <AdminShell>
      <AdminReportsClient data={data} />
    </AdminShell>
  );
}
