import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminShell from "@/components/admin/admin-shell";
import AdminDashboardClient from "@/components/admin/admin-dashboard-client";

function getLastSevenDays() {
  const days = [];

  for (let index = 6; index >= 0; index--) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - index);

    days.push({
      date,
      label: date.toLocaleDateString("es-AR", {
        weekday: "short",
      }),
      key: date.toISOString().slice(0, 10),
    });
  }

  return days;
}

export default async function AdminDashboardPage() {
  const user = await requireAdmin();

  const lastSevenDays = getLastSevenDays();
  const firstDay = lastSevenDays[0]?.date ?? new Date();

  const [
    queries,
    branchesCount,
    activeHealthInsurancesCount,
    activeHealthInsurances,
    inactiveHealthInsurances,
  ] = await Promise.all([
    prisma.query.findMany({
      where: {
        createdAt: {
          gte: firstDay,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),

    prisma.branch.count(),

    prisma.healthInsurance.count({
      where: {
        isActive: true,
      },
    }),

    prisma.healthInsurance.count({
      where: {
        isActive: true,
      },
    }),

    prisma.healthInsurance.count({
      where: {
        isActive: false,
      },
    }),
  ]);

  const queriesPerDay = lastSevenDays.map((day) => {
    const total = queries.filter((query) => {
      const queryDateKey = query.createdAt.toISOString().slice(0, 10);
      return queryDateKey === day.key;
    }).length;

    return {
      label: day.label,
      value: total,
    };
  });

  const frequentQueriesMap = new Map<string, number>();

  queries.forEach((query) => {
    const label = query.normalizedText || query.originalText;

    if (!label) return;

    frequentQueriesMap.set(label, (frequentQueriesMap.get(label) ?? 0) + 1);
  });

  const frequentQueries = Array.from(frequentQueriesMap.entries())
    .map(([label, value]) => ({
      label,
      value,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const userQueriesMap = new Map<string, number>();

  queries.forEach((query) => {
    const label = query.user?.name ?? "Usuario";

    userQueriesMap.set(label, (userQueriesMap.get(label) ?? 0) + 1);
  });

  const userQueries = Array.from(userQueriesMap.entries())
    .map(([label, value]) => ({
      label,
      value,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <AdminShell>
      <AdminDashboardClient
        userName={user.name}
        stats={{
          queriesCount: queries.length,
          branchesCount,
          healthInsurancesCount: activeHealthInsurancesCount,
        }}
        queriesPerDay={queriesPerDay}
        frequentQueries={frequentQueries}
        userQueries={userQueries}
        insuranceStatus={{
          active: activeHealthInsurances,
          inactive: inactiveHealthInsurances,
        }}
      />
    </AdminShell>
  );
}