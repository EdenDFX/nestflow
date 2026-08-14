# NestFlow Architecture

| Field | Value |
| --- | --- |
| Status | Accepted for planning |
| Last updated | 2026-08-05 |
| Related ADRs | ADR-001, ADR-002, ADR-003, ADR-004 |

## 1. Summary

NestFlow is a Next.js App Router application deployed on Vercel. It uses Supabase for authentication, Postgres data, and realtime fan-out. Heavy files and task attachments are stored in private Cloudflare R2 buckets, with metadata in Postgres. Email is delivered through Resend. Browser push uses the Web Push API with stored subscriptions.

The gear management system remains a separate application. NestFlow may later store references to gear entities; it does not own gear inventory.

## 2. High-level diagram

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
┌───────────────┐ ┌────────────────┐ ┌─────────────┐ ┌──────────────┐
│   Supabase    │ │ Cloudflare R2  │ │   Resend    │ │   Sentry     │
│ Auth          │ │ Private objects│ │  Email      │ │  Monitoring  │
│ Postgres+RLS  │ │ (attachments)  │ └─────────────┘ └──────────────┘
│ Realtime      │ └────────────────┘
└───────────────┘
```

## 3. Application structure (planned)

```text
src/
  app/                 # App Router routes (role-aware layouts)
  components/          # NestFlow UI built on shadcn/ui
  features/            # Domain modules (tasks, users, notifications)
  lib/                 # Shared utilities, clients, auth helpers
  server/              # Server-only modules, permissions, jobs
  styles/              # Global tokens and theme CSS
  types/               # Shared TypeScript types
```

Exact folder names may adjust during scaffold, but domain isolation should remain.

## 4. Rendering and data access

| Concern | Approach |
| --- | --- |
| Default UI | React Server Components |
| Interactive UI | Client Components only when required |
| Mutations | Server Actions with Zod validation |
| HTTP endpoints | Route Handlers (webhooks, push, health) |
| Auth session | Supabase Auth cookies / server client |
| Authorisation | Server permission checks + Postgres RLS |
| Live updates | Supabase Realtime subscriptions where useful |

## 5. Bounded contexts

| Context | Responsibility |
| --- | --- |
| Identity | Employees, Nest IDs, invites, deactivation |
| Access | Roles, team membership, permission checks |
| Work | Workspaces, tasks, statuses, checklists, tags |
| Collaboration | Comments, mentions, attachments, activity |
| Notifications | Event fan-out to in-app, email, push |
| Admin / Audit | Configuration and security event history |

## 6. Security boundaries

1. Browser never receives the Supabase service-role key or R2 secret keys.
2. All user-facing queries run as the authenticated role under RLS.
3. Privileged admin operations use audited server paths.
4. Attachments live in private Cloudflare R2 buckets; access uses short-lived signed URLs after permission checks.
5. Webhook and push endpoints verify authenticity and authorisation.
6. Secrets live in Vercel / Supabase / Cloudflare environment configuration only.


## 7. Identity model

- Internal primary key: `auth.users.id` UUID
- Human-facing identifier: Nest ID (unique, not a password)
- Login identifiers: Nest ID or work email
- Application roles stored in NestFlow tables, not editable user metadata
- Deactivation blocks authentication while preserving attribution

See [ADR-002](../decisions/ADR-002-authentication.md) and [ADR-003](../decisions/ADR-003-role-access-model.md).

## 8. Notification architecture

```text
Domain event (assignment, mention, overdue)
        │
        ▼
Notification service (server)
        │
        ├── write in-app notification row
        ├── enqueue / send Resend email (if enabled)
        └── send Web Push to active subscriptions (if enabled)
```

Delivery preferences are respected except where policy requires mandatory operational mail (for example, invite messages).

## 9. Environments

| Environment | Purpose |
| --- | --- |
| Local | Developer machines with local or branch Supabase |
| Preview | Vercel preview deployments per PR |
| Staging | Optional `tasks-staging.nestbyeden.app` |
| Production | `tasks.nestbyeden.app` |

## 10. Observability

- Application errors: Sentry (recommended before production)
- Platform logs: Vercel + Supabase logs
- Audit events: first-party audit table for admin/security actions

## 11. Explicit non-integrations (v1)

- Direct write access to gear inventory tables
- Shared UI package with the gear system (may be revisited later)
- Public marketing site inside this app

## 12. Attachment flow (R2)

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

## 13. Future extension points

- Gear reference fields on tasks
- MFA / passkeys
- Background job processor if email/push volume requires queues
- Reporting warehouse export
- Optional migration of NestByEden gear images to R2
