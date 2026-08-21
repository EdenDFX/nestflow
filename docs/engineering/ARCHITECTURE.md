# NestFlow architecture

Describes how NestFlow is structured, where data lives, and which boundaries you must not cross.

| Field | Value |
| --- | --- |
| Status | Accepted |
| Last updated | 2026-08-14 |
| Related ADRs | ADR-001, ADR-002, ADR-003, ADR-004, ADR-005 |

## Overview

NestFlow is a Next.js App Router app on Vercel. Supabase provides authentication, Postgres, and Realtime. Task attachments live in private Cloudflare R2. Postgres stores metadata only. Email goes through Resend. Browser push uses the Web Push API. Optional Google Chat cards use a space incoming webhook (ADR-005).

The gear management system is a separate app. NestFlow can store gear references on tasks. It doesn't own gear inventory.

## High-level diagram

```text
┌────────────────────────────────────────────────────────────┐
│                     Browser (responsive)                   │
│  Next.js UI · Service Worker (Web Push) · Theme (L/D)      │
└───────────────┬─────────────────────────────┬──────────────┘
                │ HTTPS                       │ Push
                ▼                             ▼
┌──────────────────────────────┐   ┌─────────────────────────┐
│         Vercel / Next.js     │   │   Push service (UA)     │
│  Server Components           │   └─────────────────────────┘
│  Server Actions              │
│  Route Handlers / webhooks   │
│  R2 signed URL issuance      │
└───────┬──────────────┬───────┘
        │              │
        ▼              ▼
┌───────────────┐ ┌────────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────────┐
│   Supabase    │ │ Cloudflare R2  │ │   Resend    │ │ Google Chat │ │   Sentry     │
│ Auth          │ │ Private objects│ │  Email      │ │  Space hook │ │  Monitoring  │
│ Postgres+RLS  │ │ (attachments)  │ └─────────────┘ └─────────────┘ └──────────────┘
│ Realtime      │ └────────────────┘
└───────────────┘
```

## Application structure

```text
src/
  app/                 # App Router routes, intercepting task pane, API routes
  components/          # UI, NestFlow surfaces, lucide-animated icons
  lib/                 # Auth, tasks, admin, notifications, search, security
  proxy.ts             # Request proxy / session boundary
```

Domain logic lives under `src/lib/<area>/`. Keep `page.tsx` files thin.

## Surfaces

| Route | Who | Purpose |
| --- | --- | --- |
| `/login` | Everyone | Nest ID or email sign-in |
| `/app` | Line Manager (home), others | Dashboard |
| `/app/my-tasks` | Staff, Line Manager, HR | Personal day plan (Admin redirects to Overview) |
| `/app/work` | Staff, Line Manager | Board, list, and calendar |
| `/app/team` | Line Manager | Team board, workload, blocked |
| `/app/reports` | Admin, Line Manager, HR | Period staff performance (charts + detail; Admin department-scoped by default) |
| `/app/people` | HR | HR queues, templates, automation |
| `/app/admin` | Admin | Overview: Work (`AdminOversight`) and People (`AdminSuite`) |
| `/app/notifications` | Everyone | Inbox, including mentions |
| `/app/tasks/[id]` | Permitted viewers | Task detail (also a slide-over pane) |

`/app/board`, `/app/list`, and `/app/calendar` redirect into `/app/work`. Command palette (⌘K) searches tasks and people the viewer can access.

## Rendering and data access

| Concern | Approach |
| --- | --- |
| Default UI | React Server Components |
| Interactive UI | Client Components only when required |
| Mutations | Server Actions with Zod validation |
| HTTP endpoints | Route Handlers (`/api/health`, `/api/cron/overdue`, `/api/cron/performance-reports`) |
| Auth session | Supabase Auth cookies / server client |
| Authorisation | Server permission checks + Postgres RLS |
| Live updates | Supabase Realtime subscriptions where useful |

## Bounded contexts

| Context | Responsibility |
| --- | --- |
| Identity | Employees, Nest IDs, invites, deactivation |
| Access | Roles, team membership, permission checks |
| Work | Workspaces, tasks, statuses, checklists, tags |
| Collaboration | Comments, mentions, attachments, activity |
| Notifications | Event fan-out to in-app, email, push, and optional Google Chat |
| Reports | Period aggregates for staff performance digests and `/app/reports` |
| Search | Command palette over visible tasks and people |
| Admin / Audit | Configuration and security event history |
| Enhancements | Recurrence, approvals, dependencies, time, templates, automation, gear links |

## Security boundaries

1. The browser never receives the Supabase service-role key or R2 secret keys.
2. All user-facing queries run as the authenticated role under RLS.
3. Privileged admin operations use audited server paths.
4. Attachments live in private Cloudflare R2 buckets. Access uses short-lived signed URLs after permission checks.
5. Cron routes require a `CRON_SECRET` bearer token.
6. The browser never receives Chat webhook URLs or service-account keys.
7. Secrets live in Vercel / Supabase / Cloudflare environment configuration only.

## Identity model

- Internal primary key: `auth.users.id` UUID
- Human-facing identifier: Nest ID (unique, not a password)
- Sign-in identifiers: Nest ID or work email
- Application roles stored in NestFlow tables, not editable user metadata
- Deactivation blocks authentication while preserving attribution. Open work is reassigned first.

See [ADR-002](../decisions/ADR-002-authentication.md) and [ADR-003](../decisions/ADR-003-role-access-model.md).

## Notification architecture

```text
Domain event (assignment, mention, overdue)
        │
        ▼
Notification service (server)
        │
        ├── write in-app notification row
        ├── enqueue / send Resend email (if enabled)
        ├── send Web Push to active subscriptions (if enabled)
        └── POST Google Chat card (space webhook if configured)
```

Delivery preferences are respected except where policy requires mandatory operational mail (for example, invite messages). Chat is not task storage. Cards link into NestFlow. See [ADR-005](../decisions/ADR-005-google-chat-notifications.md).

## Attachment flow (R2)

```text
Client requests upload/download
        │
        ▼
NestFlow server: auth + task permission check
        │
        ├── issue short-lived R2 signed URL
        ├── client uploads/downloads directly to R2
        └── server writes/updates attachment metadata in Postgres
```

See [ADR-004](../decisions/ADR-004-cloudflare-r2-attachments.md).

## Environments

| Environment | Purpose |
| --- | --- |
| Local | Developer machines with local or branch Supabase |
| Preview | Vercel preview deployments per PR |
| Staging | Optional `tasks-staging.nestbyeden.app` |
| Production | `tasks.nestbyeden.app` (DNS cutover ops pending) |

## Observability

- Application errors: Sentry (no-op until `NEXT_PUBLIC_SENTRY_DSN` is set)
- Platform logs: Vercel + Supabase logs
- Audit events: first-party audit table for admin and security actions
- Liveness: `GET /api/health`

## Explicit non-integrations (v1)

- Direct write access to gear inventory tables
- Shared UI package with the gear system
- Public marketing site inside this app
- Two-way Google Chat commands or Chat as a task store

## Future extension points

- Passkeys / MFA (T-087)
- Background job processor if email/push volume requires queues
- Reporting warehouse export (beyond in-app period reports)
- Admin org settings, notification template gallery, and health UI (T-071–T-073)
- Google Chat personal DMs when Workspace Admin can install the NestFlow Chat app

## See Also

- [API](API.md)
- [Database](DATABASE.md)
- [Role matrix](ROLE_MATRIX.md)
- [Documentation style](DOCS_STYLE.md)
- [ADR-005](../decisions/ADR-005-google-chat-notifications.md)
- [Google Chat setup](GOOGLE_CHAT_SETUP.md)
