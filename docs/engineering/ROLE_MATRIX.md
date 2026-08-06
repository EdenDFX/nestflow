# NestFlow role permission matrix

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
| Assign / reassign tasks | Yes | Yes | Yes | No |
| Team board / workload / blocked | Yes | Yes | No | No |
| HR people workspaces (`kind=hr`) | Yes | No | Yes | No |
| Create tasks in general workspaces | Yes | Yes | Yes | Yes |
| Comment / checklist / status (in scope) | Yes | Yes | Yes | Yes |

Automated assertions live in `src/lib/security/authz.test.ts` (`pnpm test`).
