# NestFlow role permission matrix

Capabilities by role, enforced in the UI, server, and RLS.

| Field | Value |
| --- | --- |
| Last updated | 2026-08-14 |
| Related | ADR-003 |

## Overview

Role grants capability. Team membership grants scope. Automated assertions live in `src/lib/security/authz.test.ts`. Run `pnpm test`.

Derived from ADR-003 and enforced in:

- UI navigation (`src/lib/auth/navigation.ts`)
- Server guards (`requireRoles`, `rolesAllow`)
- Postgres RLS helpers (`has_role`, `can_view_task`, workspace `kind`)

| Capability | Admin | Line Manager | HR | Staff |
| --- | --- | --- | --- | --- |
| Manage users and NestFlow roles | Yes | No | No | No |
| Invite / activate / deactivate | Yes | No | Yes | No |
| Manage departments | Yes | No | No | No |
| View audit log | Yes | No | No | No |
| Assign / reassign tasks | Yes (any) | Yes (roster) | Yes (self, admin, line managers only) | No |
| Board / List views | No | Yes | No | Yes |
| Team board / workload / blocked | No (see Overview reports) | Yes | No | No |
| Staff period reports (`/app/reports`) | Yes (department-scoped by default; All optional) | Yes (managed teams) | Yes (org-wide) | No |
| Admin Overview (all tasks, log, reports) | Yes | No | No | No |
| People suite | Optional (if also HR) | No | Yes | No |
| HR people workspaces (`kind=hr`) | Yes | No | Yes | No |
| Create & update permitted tasks | Yes | Yes (team) | Yes (HR + own) | Yes (own / assigned only) |
| View others' team tasks without assignment | Yes | Yes (managed teams) | HR queues only | No |
| Comment / checklist / status (in scope) | Yes | Yes | Yes | Yes |

## See Also

- [ADR-003](../decisions/ADR-003-role-access-model.md)
- [API](API.md)
- [Architecture](ARCHITECTURE.md)
