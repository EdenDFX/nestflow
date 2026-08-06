# NestFlow API

| Field | Value |
| --- | --- |
| Status | Draft |
| Last updated | 2026-08-05 |
| Style | Server Actions first; Route Handlers for HTTP edges |

## 1. Principles

1. Prefer Server Actions for first-party UI mutations.
2. Use Route Handlers for webhooks, push endpoints, health checks, and external HTTP.
3. Validate every input with Zod.
4. Authenticate and authorise before any mutation or sensitive read.
5. Return stable error codes suitable for UI handling.
6. Never leak internal exception details to clients.

## 2. Auth context

Every protected operation resolves:

| Field | Meaning |
| --- | --- |
| `userId` | `auth.users.id` |
| `nestId` | Human-facing Nest ID |
| `roles` | One or more NestFlow roles |
| `teamIds` | Teams in scope |
| `isActive` | Must be true to proceed |

Inactive users receive `AUTH_INACTIVE`.

## 3. Error contract

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

Server Actions should throw or return a typed result using the same codes.

## 4. Server Actions (planned)

### 4.1 Auth / users

| Action | Description | Roles |
| --- | --- | --- |
| `inviteUser` | Create invite for Nest ID + email | Admin, HR |
| `activateUser` | Mark user active | Admin, HR |
| `deactivateUser` | Block sign-in; keep history | Admin, HR |
| `updateProfile` | Update safe profile fields | Self |
| `updateNotificationPreferences` | Channel preferences | Self |

### 4.2 Workspaces / teams

| Action | Description | Roles |
| --- | --- | --- |
| `createDepartment` | Create department / team | Admin |
| `updateDepartment` | Rename or archive | Admin |
| `addTeamMember` | Membership grant | Admin, Line Manager (scoped) |
| `removeTeamMember` | Membership revoke | Admin, Line Manager (scoped) |

### 4.3 Tasks

| Action | Description | Roles |
| --- | --- | --- |
| `createTask` | Create task in workspace | Admin, Line Manager, HR, Staff (policy-dependent) |
| `updateTask` | Edit fields | Permitted editors |
| `changeTaskStatus` | Transition status | Permitted editors |
| `assignTask` | Set assignees | Admin, Line Manager, HR (scoped) |
| `addChecklistItem` | Checklist create | Permitted editors |
| `toggleChecklistItem` | Checklist complete toggle | Permitted editors |
| `addComment` | Comment create; parse mentions | Task participants with comment permission |
| `createAttachmentUploadUrl` | Authz check + short-lived R2 signed upload URL | Permitted editors |
| `finalizeAttachment` | Register R2 object key + metadata after upload | Permitted editors |
| `createAttachmentDownloadUrl` | Authz check + short-lived R2 signed download URL | Users who can view the task |
| `removeAttachment` | Soft-delete metadata; queue R2 hard-delete | Permitted editors / Admin |

### 4.4 Notifications

| Action | Description | Roles |
| --- | --- | --- |
| `markNotificationRead` | Single read | Self |
| `markAllNotificationsRead` | Bulk read | Self |
| `subscribePush` | Store Web Push subscription | Self |
| `unsubscribePush` | Remove subscription | Self |

## 5. Route Handlers (planned)

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Liveness |
| `POST` | `/api/webhooks/resend` | Email delivery events (verified) |
| `POST` | `/api/cron/overdue` | Overdue scan / notification fan-out (secured) |
| `POST` | `/api/cron/attachment-cleanup` | Hard-delete soft-removed R2 objects (secured) |
| `POST` | `/api/push/test` | Staging-only push verification |

### Attachment constraints (v1 intent)

| Constraint | Initial value |
| --- | --- |
| Max file size | 25 MB per file (confirm at implementation) |
| Allowed types | Common images, PDF, office docs; block executables |
| URL TTL | Short-lived signed URLs (minutes, not hours) |

Exact cron protection may use Vercel cron secrets or equivalent.

## 6. Status transition rules

Allowed transitions (v1):

```text
Backlog → To Do, In Progress
To Do → In Progress, Blocked, Backlog
In Progress → Blocked, Review, To Do
Blocked → To Do, In Progress
Review → In Progress, Completed
Completed → In Progress (reopen; audited)
```

`Blocked` requires `blockedReason`.
Illegal transitions return `CONFLICT`.

## 7. Pagination and filtering

List endpoints / loaders accept:

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

## 8. Idempotency

Notification fan-out and invite creation should use idempotency keys or unique constraints where duplicate submits are likely.

## 9. Versioning

v1 does not expose a public external API. If a public API is required later, version via `/api/v1` and publish a separate contract.

## 10. Testing requirements

- Unit tests for Zod schemas and transition rules
- Integration tests for permission denials
- Playwright coverage for login, create task, assign, comment, complete
