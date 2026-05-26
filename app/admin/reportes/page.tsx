import AdminShell from "@/components/admin/admin-shell";
import { AdminReportsClient } from "@/components/admin/admin-reports-client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  formatReportDate,
  type ChartDatum,
  type ReportsData,
} from "@/lib/reports";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type QueryForReport = {
  id: string;
  originalText: string;
  resultFound: boolean;
  topScore: number;
  createdAt: Date;
  user: { name: string } | null;
  branch: { name: string } | null;
  detectedHealthInsurance: { name: string } | null;
};

function getSingleParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseDateParam(value: string | undefined, fallback: Date) {
  if (!value) return fallback;

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getDateRange(params: Record<string, string | string[] | undefined>) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const defaultStart = addDays(today, -13);
  const defaultEnd = today;

  let start = parseDateParam(getSingleParam(params, "startDate"), defaultStart);
  let end = parseDateParam(getSingleParam(params, "endDate"), defaultEnd);

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  if (start > end) {
    const previousStart = start;
    start = end;
    end = previousStart;
  }

  return {
    start,
    end,
    endExclusive: addDays(end, 1),
    startInput: toDateInputValue(start),
    endInput: toDateInputValue(end),
  };
}

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

function getDaysBetween(start: Date, end: Date) {
  const days: { key: string; name: string }[] = [];
  const cursor = new Date(start);
  let guard = 0;

  while (cursor <= end && guard < 62) {
    days.push({
      key: cursor.toISOString().slice(0, 10),
      name: cursor.toLocaleDateString("es-AR", {
        weekday: "short",
        day: "2-digit",
      }),
    });

    cursor.setDate(cursor.getDate() + 1);
    guard += 1;
  }

  return days;
}

export default async function AdminReportsPage({ searchParams }: PageProps) {
  await requireAdmin();

  const params = await Promise.resolve(searchParams ?? {});
  const range = getDateRange(params);
  const days = getDaysBetween(range.start, range.end);

  const [
    queries,
    usersCount,
    branchesCount,
    activeHealthInsurancesCount,
    documentsCount,
  ] = await Promise.all([
    prisma.query.findMany({
      where: {
        createdAt: {
          gte: range.start,
          lt: range.endExclusive,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 250,
      include: {
        user: {
          select: {
            name: true,
          },
        },
        branch: {
          select: {
            name: true,
          },
        },
        detectedHealthInsurance: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.user.count({
      where: {
        isActive: true,
      },
    }),
    prisma.branch.count({
      where: {
        isActive: true,
      },
    }),
    prisma.healthInsurance.count({
      where: {
        isActive: true,
      },
    }),
    prisma.document.count({
      where: {
        isActive: true,
      },
    }),
  ]);

  const typedQueries = queries as QueryForReport[];

  const totalQueries = typedQueries.length;
  const withResponse = typedQueries.filter((query) => query.resultFound).length;
  const withoutResponse = totalQueries - withResponse;
  const responseRate =
    totalQueries > 0 ? Math.round((withResponse / totalQueries) * 100) : 0;

  const queriesByDay: ChartDatum[] = days.map((day) => ({
    name: day.name,
    value: typedQueries.filter(
      (query) => query.createdAt.toISOString().slice(0, 10) === day.key
    ).length,
  }));

  const data: ReportsData = {
    kpis: [
      {
        label: "Consultas",
        value: String(totalQueries),
        detail: "Consultas registradas en el rango seleccionado.",
      },
      {
        label: "Resolución",
        value: `${responseRate}%`,
        detail: `${withResponse} con respuesta y ${withoutResponse} sin respuesta suficiente.`,
      },
      {
        label: "Obras sociales",
        value: String(activeHealthInsurancesCount),
        detail: "Activas para consulta.",
      },
      {
        label: "Normativas",
        value: String(documentsCount),
        detail: "Documentos normativos activos.",
      },
      {
        label: "Usuarios",
        value: String(usersCount),
        detail: "Usuarios activos en el sistema.",
      },
      {
        label: "Sucursales",
        value: String(branchesCount),
        detail: "Sucursales activas registradas.",
      },
    ],
    queriesByDay,
    queriesByBranch: groupCount(
      typedQueries,
      (query) => query.branch?.name ?? "Sin sucursal"
    ).slice(0, 8),
    queriesByHealthInsurance: groupCount(
      typedQueries,
      (query) => query.detectedHealthInsurance?.name ?? "No detectada"
    ).slice(0, 8),
    responseStatus: [
      {
        name: "Con respuesta",
        value: withResponse,
      },
      {
        name: "Sin respuesta",
        value: withoutResponse,
      },
    ].filter((item) => item.value > 0),
    latestQueries: typedQueries.map((query) => ({
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
      <AdminReportsClient
        data={data}
        initialStartDate={range.startInput}
        initialEndDate={range.endInput}
      />
    </AdminShell>
  );
}
