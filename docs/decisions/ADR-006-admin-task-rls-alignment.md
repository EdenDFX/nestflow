# ADR-006 — Admin task RLS alignment

Align Postgres RLS with oversight-only administrator task policy.

| Field | Value |
| --- | --- |
| Status | Proposed |
| Date | 2026-09-04 |
| Product | NestFlow |
| Related | ADR-003, ROLE_MATRIX.md |

## Context

NestFlow distinguishes **oversight-only administrators** (`admin` without `line_manager` or `hr`) from operational roles. The UI and server actions treat oversight-only admins as view-only on tasks: they may read tasks and post comments, but not change status, checklist, attachments, or assignees.

Postgres RLS still grants edit through `nestflow.can_edit_task`, which includes `has_role('admin')` unconditionally. That creates a gap where direct Supabase client access could bypass application policy.

## Decision (proposed)

1. Remove the blanket `has_role('admin')` branch from `can_edit_task`, **or** add a helper `is_operational_admin()` that returns true only when the user also holds `line_manager` or `hr`.
2. Keep `has_role('admin')` in `can_view_task` so administrators retain org-wide read access.
3. Apply the same rule to `task_assignees` write policies that grant admin without task scope.
4. Ship the migration only after server-action guards and UI are verified in staging.

## Server layer (shipped before migration)

- `isAdminTaskOversightOnly()` in `src/lib/tasks/interaction-mode.ts`
- Task update, status, archive, checklist, and attachment actions check this helper
- `createTaskFromTemplateAction` requires `create_tasks` (line managers only)

## Consequences

### Positive

- Three-layer enforcement (UI, server, RLS) matches ADR-003
- Reduces privilege escalation via direct API access

### Negative / trade-offs

- Requires a coordinated migration and regression pass on multi-role admin users
- Admin + line_manager users keep full edit through their manager role

## Follow-ups

- [ ] Apply Supabase migration for `can_edit_task`
- [ ] Regression test admin-only, admin+LM, and admin+HR combinations
- [ ] Update DATABASE.md RLS section after migration lands

## See Also

- [Role matrix](../engineering/ROLE_MATRIX.md)
- [ADR-003](ADR-003-role-access-model.md)
