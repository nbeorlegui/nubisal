import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminShell from "@/components/admin/admin-shell";
import AdminUsersBranchesClient from "@/components/admin/admin-users-branches-client";

export default async function AdminUsersPage() {
  const user = await requireAdmin();

  const [users, branches] = await Promise.all([
    prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        branchId: true,
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),

    prisma.branch.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        code: true,
        address: true,
        city: true,
        province: true,
        isActive: true,
      },
    }),
  ]);

  return (
    <AdminShell>
      <AdminUsersBranchesClient users={users} branches={branches} />
    </AdminShell>
  );
}