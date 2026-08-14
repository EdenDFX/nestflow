# ADR-003 — Role and access model

Grant capability by role and scope by team membership. Enforce in UI, server, and RLS.

| Field | Value |
| --- | --- |
| Status | Accepted |
| Date | 2026-08-05 |
| Product | NestFlow |

## Context

NestFlow serves four operational audiences: Administrator, Line Manager, HR, and Staff. Access must combine **capability** (what actions a role may perform) with **scope** (which teams/tasks are visible).

## Decision

Adopt a **role + team membership** model.

### Roles

| Role | Capability summary |
| --- | --- |
| `admin` | Full configuration, user management, audit access |
| `line_manager` | Manage work within managed teams; assign/reassign; monitor blocked work |
| `hr` | People-related task suites; invite/deactivate with policy; HR queues |
| `staff` | Work on assigned tasks; comment; update checklist/status within policy |

A user may hold more than one role if required; UI should present the union of capabilities carefully.

### Scope

- Team membership determines default task visibility.
- Assignees can see tasks assigned to them even across limited cases as policy allows.
- HR-private workflows restrict visibility. Workspaces with `kind=hr` are visible to HR and Admin only.
- Admins can operate globally.

### Enforcement layers

1. **UI gating** for clarity (not security).
2. **Server Action / Route Handler checks** for every mutation and sensitive read.
3. **Postgres RLS** as the data backstop.

Deny by default.

### Lifecycle

- Deactivation sets `profiles.is_active = false` and blocks auth.
- Historical tasks, comments, and activity remain attributed.
- Managers get tools to reassign open work from deactivated users.

## Consequences

### Positive

- Matches organisational reality (managers + HR + staff + admin)
- Supports least privilege
- Creates a clear test matrix

### Negative / trade-offs

- Multi-role users increase testing complexity
- HR privacy rules must be made explicit before coding sensitive queues
- Dual enforcement (server + RLS) costs more upfront and prevents silent holes

## Follow-ups

- [x] Permission matrix in [ROLE_MATRIX.md](../engineering/ROLE_MATRIX.md)
- [x] Staff may create and update their own or assigned tasks
- [x] HR workspaces (`kind=hr`) are hidden from Line Managers

## See Also

- [Role matrix](../engineering/ROLE_MATRIX.md)
- [PRD](../product/PRD.md)
- [ADR-002](ADR-002-authentication.md)
