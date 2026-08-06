import { AdminOversight } from "@/components/admin/admin-oversight";
import { getAdminOversightData } from "@/lib/admin/queries";
import { requireRoles } from "@/lib/auth/guards";

export default async function AdminPage() {
  await requireRoles(["admin"]);
  const { tasks, log, report, users } = await getAdminOversightData();

  return (
    <AdminOversight
      tasks={tasks}
      log={log}
      report={report}
      users={users}
    />
  );
}
