import AdminShell from "@/components/admin/admin-shell";
import { AdminProjectionClient } from "@/components/admin/admin-projection-client";
import { requireAdmin } from "@/lib/auth";

export default async function AdminProjectionPage() {
  await requireAdmin();

  return (
    <AdminShell>
      <AdminProjectionClient />
    </AdminShell>
  );
}
