import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import UserConsultationClient from "@/components/user/user-consultation-client";

export default async function ConsultaPage() {
  const user = await requireUser();

  const [healthInsurances, news] = await Promise.all([
    prisma.healthInsurance.findMany({
      orderBy: [
        { isActive: "desc" },
        { name: "asc" },
      ],
      select: {
        id: true,
        name: true,
        code: true,
        isActive: true,
      },
    }),

    prisma.news.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
      },
    }),
  ]);

  return (
    <UserConsultationClient
      user={{
        name: user.name,
        role: user.role,
        branchName: user.branch?.name ?? "Sin sucursal asignada",
      }}
      healthInsurances={healthInsurances}
      news={news.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        date: item.createdAt.toLocaleDateString("es-AR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
      }))}
    />
  );
}