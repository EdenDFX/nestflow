# NestFlow API

Server Actions and HTTP routes NestFlow uses today, plus the error contract you handle in the UI.

| Field | Value |
| --- | --- |
| Status | Current |
| Last updated | 2026-08-14 |
| Style | Server Actions first; Route Handlers for HTTP edges |

## Overview

Prefer Server Actions for first-party UI mutations. Use Route Handlers for health, cron, and other non-UI HTTP. Validate every input with Zod. Authenticate and authorise before any mutation or sensitive read. Return stable error codes. Don't leak internal exception details to clients.

## Auth context

Every protected operation resolves:

| Field | Meaning |
| --- | --- |
| `userId` | `auth.users.id` |
| `nestId` | Human-facing Nest ID |
| `roles` | One or more NestFlow roles |
| `teamIds` | Teams in scope |
| `isActive` | Must be true to proceed |

Inactive users receive `AUTH_INACTIVE`.

## Error contract

```ts
type ApiError = {
  code: string
  message: string
  fields?: Record<string, string>
}
```

| Code | HTTP (Route Handlers) | Meaning |
| --- | --- | --- |
| `AUTH_REQUIRED` | 401 | No valid session |
| `AUTH_INACTIVE` | 403 | Deactivated account |
| `FORBIDDEN` | 403 | Lacks permission or scope |
| `NOT_FOUND` | 404 | Resource missing or invisible under RLS |
| `VALIDATION_ERROR` | 400 | Zod validation failed |
| `CONFLICT` | 409 | Illegal state transition or duplicate |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL` | 500 | Unexpected failure |

Server Actions throw or return a typed result using the same codes.

## Server Actions

Names below match the exported functions. Roles are the typical callers; server authz still decides.

### Auth / users

| Action | Description | Roles |
| --- | --- | --- |
| `signInAction` | Nest ID or email + password | Public |
| `signOutAction` | End session | Self |
| `setProfileStatusAction` | Activate or deactivate (reassign open work first) | Admin, HR |
| `setUserRolesAction` | Replace NestFlow roles | Admin |
| `setProfileDepartmentAction` | Set department | Admin |
| `createInviteAction` | Invite Nest ID + email | Admin, HR |
| `revokeInviteAction` | Revoke unused invite | Admin, HR |
| `updateNotificationPreferencesAction` | Channel preferences | Self |

### Workspaces / teams / admin

| Action | Description | Roles |
| --- | --- | --- |
| `createDepartmentAction` | Create department | Admin |
| `deleteDepartmentAction` | Remove department | Admin |
| `setTeamMembershipAction` | Grant or revoke membership | Admin |

### Tasks

| Action | Description | Roles |
| --- | --- | --- |
| `createTaskAction` | Create task in a workspace | Permitted creators |
| `updateTaskAction` | Edit fields, including assignees | Permitted editors |
| `changeTaskStatusAction` | Transition status | Permitted editors |
| `archiveTaskAction` | Soft-archive | Permitted editors |
| `reassignTasksAction` | Bulk reassign | Admin, Line Manager, HR (scoped) |
| `addChecklistItemAction` | Checklist create | Permitted editors |
| `toggleChecklistItemAction` | Checklist complete toggle | Permitted editors |
| `removeChecklistItemAction` | Checklist remove | Permitted editors |
| `addCommentAction` | Comment create; parse mentions | Task participants |
| `createAttachmentUploadUrlAction` | Authz + short-lived R2 signed upload URL | Permitted editors |
| `createAttachmentDownloadUrlAction` | Authz + short-lived R2 signed download URL | Viewers |
| `removeAttachmentAction` | Soft-delete metadata; remove R2 object | Permitted editors / Admin |
| `getAttachmentConfigAction` | Whether R2 is configured | Signed-in |

### Search and notifications

| Action | Description | Roles |
| --- | --- | --- |
| `searchWorkspaceAction` | Tasks and people the viewer can access | Signed-in |
| `markNotificationReadAction` | Single read | Self |
| `markAllNotificationsReadAction` | Bulk read | Self |
| `subscribePushAction` | Store Web Push subscription | Self |
| `unsubscribePushAction` | Remove subscription | Self |
| `getPushConfigAction` | Whether VAPID is configured | Signed-in |

### M8 enhancements

| Action | Description | Roles |
| --- | --- | --- |
| `updateTaskM8FieldsAction` | Recurrence, approval, gear fields | Permitted editors |
| `addTaskDependencyAction` / `removeTaskDependencyAction` | Blocked-by links | Permitted editors |
| `logTimeEntryAction` / `deleteTimeEntryAction` | Time on a task | Permitted editors |
| `requestTaskApprovalAction` / `decideTaskApprovalAction` | Request / approve / reject | Requester; managers, HR, Admin decide |
| `createTaskTemplateAction` / `archiveTaskTemplateAction` | HR templates | HR, Admin |
| `createTaskFromTemplateAction` | Spawn tasks from a template | HR, Admin |
| `createAutomationRuleAction` / `setAutomationRuleActiveAction` | Status/create/complete rules | HR, Admin |

## Route Handlers

| Method | Path | Purpose | Status |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Liveness plus `googleChat` configured/missing | Shipped |
| `POST` | `/api/cron/overdue` | Overdue / due-soon fan-out (`CRON_SECRET`) | Shipped |
| `POST` | `/api/webhooks/resend` | Email delivery events | Not shipped |
| `POST` | `/api/cron/attachment-cleanup` | Hard-delete soft-removed R2 objects | Not shipped |
| `POST` | `/api/push/test` | Staging-only push verification | Not shipped |

### Attachment constraints

| Constraint | Value |
| --- | --- |
| Max file size | 25 MB per file |
| Allowed types | Common images, PDF, office docs; block executables |
| URL TTL | Short-lived signed URLs (minutes, not hours) |

## Status transition rules

Allowed transitions:

```text
Backlog → To Do, In Progress
To Do → In Progress, Blocked, Backlog
In Progress → Blocked, Review, To Do
Blocked → To Do, In Progress
Review → In Progress, Completed
Completed → In Progress (reopen; audited)
```

`Blocked` requires `blockedReason`. Illegal transitions return `CONFLICT`. Completing a task that still has open dependencies also returns `CONFLICT`.

## Pagination and filtering

List loaders accept:

| Param | Notes |
| --- | --- |
| `cursor` or `page` | Prefer cursor for large sets |
| `limit` | Default 20; max 100 |
| `status` | Multi-select |
| `assigneeId` | UUID |
| `teamId` | UUID |
| `dueBefore` / `dueAfter` | ISO dates |
| `q` | Search query |

Responses include only rows visible under RLS and server scope checks.

## Idempotency

Notification fan-out and invite creation use idempotency keys or unique constraints where duplicate submits are likely.

## Versioning

v1 doesn't expose a public external API. If a public API is required later, version via `/api/v1` and publish a separate contract.

## Testing requirements

- Unit tests for Zod schemas, transition rules, and authz (`pnpm test`)
- Playwright for login, assign, comment, complete, and role-denied paths (not shipped)

## See Also

- [Architecture](ARCHITECTURE.md)
- [Role matrix](ROLE_MATRIX.md)
- [Database](DATABASE.md)
