# NestFlow role permission matrix

Capabilities by role, enforced in the UI, server, and RLS.

| Field | Value |
| --- | --- |
| Last updated | 2026-09-03 |
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
| Assign / reassign tasks | No (view only) | Yes (roster) | Yes (self, admin, line managers only) | No |
| Create tasks | No | Yes (always starts in To Do) | No | No (personal notes instead) |
| Board / List views | No | Yes | No | Yes |
| Team board / workload / blocked | No (see Overview reports) | Yes | No | No |
| Staff period reports (`/app/reports`) | Yes (department-scoped by default; All optional) | Yes (managed teams) | Yes (all departments; department-scoped by default; All optional) | No |
| Line manager weekly rollup (`/app/reports?view=managers`) | Yes | No | No | No |
| Admin Overview (all tasks, log, reports) | Yes | No | No | No |
| People suite | Optional (if also HR) | No | Yes | No |
| HR people workspaces (`kind=hr`) | Yes | No | Yes | No |
| Edit task details (title, due, assignees, archive) | No (view only) | Yes (team) | Yes (in scope) | No |
| Set status To Do | No | Yes | No | No |
| Set status In Progress / Blocked / Review | No | No | Yes | Yes |
| Set status Completed | No | Yes | No | No |
| Progress update (checklist, chat) on assigned tasks | Yes (comments only) | Yes | Yes | Yes |
| Personal notes notepad | Yes | Yes | Yes | Yes (primary create surface) |
| View others' team tasks without assignment | Yes | Yes (managed teams) | HR queues only | No |
| Comment / checklist / status (in scope) | Comments only | Yes | Yes | Yes |

## See Also

- [ADR-003](../decisions/ADR-003-role-access-model.md)
- [API](API.md)
- [Architecture](ARCHITECTURE.md)
