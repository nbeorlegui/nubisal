import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminShell from "@/components/admin/admin-shell";
import AdminHealthInsurancesClient from "@/components/admin/admin-health-insurances-client";

export default async function AdminHealthInsurancesPage() {
  await requireAdmin();

  const healthInsurances = await prisma.healthInsurance.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
      isActive: true,
      documents: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          title: true,
          fileName: true,
          isActive: true,
          createdAt: true,
        },
      },
    },
  });

  const normalizedItems = healthInsurances.map((item: any) => ({
    ...item,
    documents: item.documents.map((document: any) => ({
      ...document,
      createdAt: document.createdAt.toISOString(),
    })),
  }));

  return (
    <AdminShell>
      <AdminHealthInsurancesClient items={normalizedItems} />
    </AdminShell>
  );
}