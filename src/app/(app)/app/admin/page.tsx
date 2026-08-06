import { AdminSuite } from "@/components/admin/admin-suite";
import { requireRoles } from "@/lib/auth/guards";
import {
  listAuditEvents,
  listDepartments,
  listDirectoryUsers,
  listInvites,
} from "@/lib/admin/queries";

export default async function AdminPage() {
  await requireRoles(["admin"]);

  const [users, departments, invites, auditEvents] = await Promise.all([
    listDirectoryUsers(),
    listDepartments(),
    listInvites(),
    listAuditEvents(150),
  ]);

  return (
    <AdminSuite
      users={users}
      departments={departments}
      invites={invites}
      auditEvents={auditEvents}
    />
  );
}
