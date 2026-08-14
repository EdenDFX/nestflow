# NestFlow database

Tables, views, RLS intent, and applied milestone notes for the `nestflow` schema.

| Field | Value |
| --- | --- |
| Status | Applied through M8 |
| Last updated | 2026-08-14 |
| Platform | Supabase Postgres |
| Related | ADR-001, ADR-002, ADR-003, ADR-004 |

## Overview

Reuse existing Supabase Auth identities. Keep NestFlow data in schema `nestflow` with public `nf_*` views. Use `auth.users.id` as the immutable user key. Store Nest ID as a unique business identifier, never as a password. Enable FORCE RLS on every exposed table. Prefer soft deletion for people and historical task attribution. Ship every production change as a reviewed migration.

## 1. Principles

1. Reuse existing Supabase Auth identities where possible.
2. Isolate NestFlow application data in schema `nestflow` with public `nf_*` views.
3. Use `auth.users.id` as the immutable internal user key.
4. Store Nest ID as a unique business identifier, never as a password.
5. Enable RLS on every exposed table.
6. Prefer soft deletion / deactivation for people and historical task attribution.
7. Every production change ships as a reviewed migration.

## 2. Entity relationship (logical)

```text
profiles ──┬── memberships ── teams/departments
           │
           ├── task_assignees ── tasks ── workspaces
           │                      │
           │                      ├── checklist_items
           │                      ├── comments
           │                      ├── attachments
           │                      ├── task_tags ── tags
           │                      └── activity_events
           │
           ├── notifications
           ├── push_subscriptions
           └── audit_events
```

## 3. Core tables

### 3.1 `profiles`

| Column | Type | Notes |
| --- | --- | --- |
| `user_id` | uuid PK | FK to `auth.users.id` |
| `nest_id` | text unique | Human-facing Nest ID |
| `email` | citext unique | Work email |
| `full_name` | text | |
| `avatar_url` | text null | |
| `is_active` | boolean | Default true |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### 3.2 `user_roles`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `user_id` | uuid | FK profiles |
| `role` | text/enum | `admin` · `line_manager` · `hr` · `staff` |
| `created_at` | timestamptz | |
| Unique | (`user_id`, `role`) | |

### 3.3 `teams`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `name` | text | |
| `slug` | text unique | |
| `is_archived` | boolean | |
| `created_at` | timestamptz | |

### 3.4 `team_memberships`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `team_id` | uuid | |
| `user_id` | uuid | |
| `is_manager` | boolean | Line-manager scope helper |
| Unique | (`team_id`, `user_id`) | |

### 3.5 `workspaces`

Logical project spaces. v1 may map 1:1 with teams or allow team-scoped workspaces.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `team_id` | uuid | Owning team |
| `name` | text | |
| `is_archived` | boolean | |

### 3.6 `tasks`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `workspace_id` | uuid | |
| `title` | text | |
| `description` | text | Markdown or rich text storage TBD |
| `status` | enum | backlog, todo, in_progress, blocked, review, completed |
| `priority` | enum | low, medium, high, urgent |
| `due_at` | timestamptz null | |
| `blocked_reason` | text null | Required when blocked |
| `created_by` | uuid | |
| `completed_at` | timestamptz null | |
| `archived_at` | timestamptz null | |
| `created_at` / `updated_at` | timestamptz | |

### 3.7 `task_assignees`

| Column | Type | Notes |
| --- | --- | --- |
| `task_id` | uuid | |
| `user_id` | uuid | |
| `assigned_at` | timestamptz | |
| `assigned_by` | uuid | |
| PK | (`task_id`, `user_id`) | |

### 3.8 Supporting tables

- `tags`, `task_tags`
- `checklist_items`
- `comments` (with optional `parent_id`)
- `attachments` (Cloudflare R2 object key + metadata; see section 7)
- `activity_events`
- `notifications`
- `push_subscriptions`
- `notification_preferences`
- `audit_events`
- `invites`

## 4. Enums

```sql
task_status: backlog | todo | in_progress | blocked | review | completed
task_priority: low | medium | high | urgent
app_role: admin | line_manager | hr | staff
notification_channel: in_app | email | push | chat
```

## 5. Indexing guidance

| Table | Index |
| --- | --- |
| `profiles` | unique(`nest_id`), unique(`email`) |
| `tasks` | (`workspace_id`, `status`), (`due_at`), (`created_by`) |
| `task_assignees` | (`user_id`, `task_id`) |
| `notifications` | (`user_id`, `created_at` desc), (`user_id`, `read_at`) |
| `activity_events` | (`task_id`, `created_at`) |
| `audit_events` | (`created_at` desc), (`actor_id`) |

## 6. Row Level Security (policy intent)

| Table | Select | Insert/Update intent |
| --- | --- | --- |
| `profiles` | Active users can read limited peer profiles in shared teams | Self update safe fields; Admin/HR manage activation |
| `tasks` | Members of owning team / assignees / privileged roles | Create/update by permitted roles within scope |
| `comments` | Visible if task visible | Authors create; limited edit window optional |
| `attachments` | Visible if task visible | Permitted editors |
| `notifications` | Owner only | System/server writers |
| `audit_events` | Admin (and maybe HR subset) | Server only |
| `push_subscriptions` | Owner only | Owner only |

Exact SQL policies live in migrations and are tested per role.

## 7. Object storage (Cloudflare R2)

NestFlow stores heavy files in **private Cloudflare R2** buckets. Postgres stores metadata only. See [ADR-004](../decisions/ADR-004-cloudflare-r2-attachments.md).

### 7.1 Bucket

| Bucket | Access |
| --- | --- |
| `nestflow-attachments` (R2) | Private; short-lived signed URLs issued by NestFlow server |

### 7.2 `attachments` metadata columns

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `task_id` | uuid | FK tasks |
| `uploaded_by` | uuid | FK profiles / auth user |
| `object_key` | text | R2 object key (not a public URL) |
| `file_name` | text | Original filename |
| `mime_type` | text | Validated allow-list |
| `size_bytes` | bigint | Enforced max size |
| `checksum` | text null | Optional integrity hash |
| `deleted_at` | timestamptz null | Soft-delete; R2 hard-delete deferred |
| `created_at` | timestamptz | |

Object key convention: `tasks/{task_id}/{attachment_id}/{safe_file_name}`.

Never expose R2 credentials to the browser. Never rely on unguessable public URLs without authz.

## 8. Retention

| Data | Policy (initial) |
| --- | --- |
| Tasks / comments | Retain while organisation requires; soft-archive first |
| Notifications | Retain 180 days unless unread critical policy says otherwise |
| Audit events | Retain >= 24 months |
| Push subscriptions | Delete on unsubscribe or repeated hard failures |
| Attachments | Soft-delete then deferred hard delete |

## 9. Migration rules

1. Additive migrations preferred.
2. Destructive changes require an ADR or explicit approval note.
3. Backfill scripts must be idempotent.
4. MCP SQL tools may inspect; they must not replace reviewed migrations for production schema changes.

## 10. Open schema questions

1. Whether multi-role users are common enough to avoid a primary-role concept in UI. The app currently uses `primaryRole()` for home path and nav.

## 11. M1 schema notes (applied)

- Schema `nestflow` created for NestFlow-owned tables.
- `public.profiles.nest_id` added (unique when present); backfilled from email local-part.
- `nestflow.user_roles` seeded from gear Admin → `admin`, others → `staff`.
- Public RPCs: `nestflow_resolve_login_email`, `nestflow_current_profile`, `nestflow_current_roles`.

## 12. M2 schema notes (applied)

- Tables: `nestflow.teams`, `team_memberships`, `workspaces`, `tasks`, `task_assignees`, `tags`, `task_tags`
- Enums: `task_status`, `task_priority`
- RLS helpers: `has_role`, `is_team_member`, `can_manage_team`, `can_view_task`, `can_edit_task`
- Public updatable views: `nf_teams`, `nf_team_memberships`, `nf_workspaces`, `nf_tasks`, `nf_task_assignees`, `nf_tags`, `nf_task_tags`
- Seeded General team/workspace with all active profiles as members

## 13. M3 schema notes (applied)

- Collaboration tables in `nestflow`: `checklist_items`, `comments`, `attachments`, `activity_events`
- Public views: `nf_checklist_items`, `nf_comments`, `nf_attachments`, `nf_activity_events`
- Attachments store R2 `object_key` + metadata only; signed upload/download URLs issued server-side
- Soft-delete via `deleted_at` on comments and attachments

## 14. M4 schema notes (applied)

- Tables: `nestflow.notifications`, `notification_preferences`, `push_subscriptions`
- Enum: `notification_event_type` (assignment, mention, due soon, overdue, status, invite)
- Public views: `nf_notifications`, `nf_notification_preferences`, `nf_push_subscriptions`
- RPC: `public.nestflow_emit_notification` (SECURITY DEFINER fan-out; skips self for actor events)
- Unique partial index on `(user_id, idempotency_key)` for duplicate suppression
- Cron: `POST /api/cron/overdue` (Bearer `CRON_SECRET`) writes overdue/due-soon via service role
- Chat preference columns and `chat_sent_at` added later (section 18)

## 15. M5 schema notes (applied)

- Tables: `nestflow.departments`, `invites`, `audit_events`
- `workspaces.kind` (`general` | `hr`); seeded `People & HR` workspace + restored `General`
- Views: `nf_departments`, `nf_invites`, `nf_audit_events`, `nf_user_roles`
- RPCs: `nestflow_set_profile_status`, `nestflow_set_user_roles`, `nestflow_set_profile_department`, `nestflow_record_audit`
- `can_view_task` hides `kind=hr` workspaces from non-HR/non-admin
- Task visibility is participant-based: creator or assignee. Team membership alone does not grant access. Line managers see tasks on teams they manage; HR sees `kind=hr` workspace tasks; admin sees all.

## 16. M6–M7 notes (applied)

- FORCE RLS on NestFlow tables
- Soft launch on shared NestByEden **Supabase Free** (Pro deferred)
- Health route and overdue cron; no extra schema for launch pack

## 17. M8 schema notes (applied)

- Task columns: recurrence_*, approval_*, gear_ref, gear_url
- Tables: `task_dependencies`, `time_entries`, `task_templates`, `automation_rules`
- Public views: `nf_task_dependencies`, `nf_time_entries`, `nf_task_templates`, `nf_automation_rules`
- `nf_tasks` view includes M8 columns; FORCE RLS + can_view/can_edit task helpers for task-scoped rows
- Optional env: `NEXT_PUBLIC_GEAR_APP_URL` for gear deep links

## 18. Google Chat channel (applied)

Optional notification channel (ADR-005). Space incoming webhook in v1.

- `nestflow.notification_preferences`: `chat_assignment`, `chat_mention`, `chat_due_soon`, `chat_overdue` (boolean, default true)
- `nestflow.notifications.chat_sent_at` (timestamptz, nullable)
- Views `nf_notification_preferences` and `nf_notifications` recreated with `security_invoker = true` to expose the new columns
- App env: `GOOGLE_CHAT_ENABLED`, `GOOGLE_CHAT_WEBHOOK_URL` (server only). See [GOOGLE_CHAT_SETUP.md](GOOGLE_CHAT_SETUP.md)

## See Also

- [Architecture](ARCHITECTURE.md)
- [API](API.md)
- [ADR-001](../decisions/ADR-001-backend-platform.md)
- [ADR-004](../decisions/ADR-004-cloudflare-r2-attachments.md)
- [ADR-005](../decisions/ADR-005-google-chat-notifications.md)
