# NestFlow Implementation Tasks

Actionable backlog derived from the PRD and roadmap. Use this as the working checklist during build. Mark items complete only when acceptance notes are satisfied.

Status key: `todo` · `in_progress` · `blocked` · `done`

## Foundations

| ID | Task | Status | Acceptance |
| --- | --- | --- | --- |
| T-001 | Scaffold Next.js App Router + TypeScript + pnpm | done | App runs locally |
| T-002 | Configure Tailwind + shadcn/ui with NestFlow tokens (`#FF6300`) | done | Light/dark tokens render |
| T-003 | Connect Supabase local/remote project config | todo | Env validated; no secrets in client |
| T-004 | Set up Vitest + Playwright baselines | done | Vitest authz/transition tests pass; Playwright still open |
| T-005 | Configure Vercel project and preview deployments | todo | Preview URL available |
| T-006 | Plan DNS for `tasks.nestbyeden.com` | todo | Record requirements documented |

## Authentication and shell

| ID | Task | Status | Acceptance |
| --- | --- | --- | --- |
| T-010 | Implement branded login (Nest ID or email + password) | done | Successful auth redirects to app |
| T-011 | Invite-only user provisioning flow | todo | Uninvited users cannot register |
| T-012 | Role resolution for Admin, Line Manager, HR, Staff | done | Nav and gates match role |
| T-013 | App shell with responsive navigation | done | Mobile and desktop usable |
| T-014 | Theme toggle (light/dark) with persistence | done | Preference survives refresh |
| T-015 | Profile + sign-out | done | Session cleared securely |

## Tasks core

| ID | Task | Status | Acceptance |
| --- | --- | --- | --- |
| T-020 | Departments / workspaces model and UI | done | Users belong to teams |
| T-021 | Task create / edit / soft-archive | done | Validation via Zod |
| T-022 | Status workflow including Blocked reason | done | Illegal transitions rejected |
| T-023 | Assignees, priority, due date, tags | done | Filters work in list/board |
| T-024 | My Tasks view | done | Shows only accessible assignments |
| T-025 | Board view with dnd-kit + keyboard alternative | done | Status updates persist |
| T-026 | List / table view (TanStack Table) | done | Sort, filter, paginate |
| T-027 | Dashboard counters | done | Overdue / open / completed accurate |

## Collaboration

| ID | Task | Status | Acceptance |
| --- | --- | --- | --- |
| T-030 | Checklists on tasks | done | Add/toggle/remove; progress on task detail |
| T-031 | Comments + @mentions | done | Mentions parsed by Nest ID/email; notification delivery in M4 |
| T-032 | Attachments via private Cloudflare R2 + metadata in Postgres | done | Signed URLs only; UI gated until R2 env configured |
| T-033 | Activity history timeline | done | Key mutations recorded on task detail |
| T-034 | Calendar view | done | Due dates plotted; nav entry live |
| T-035 | Global search (accessible entities only) | todo | RLS respected |

## Notifications

| ID | Task | Status | Acceptance |
| --- | --- | --- | --- |
| T-040 | Notification event schema and writers | done | Idempotent keys for assignment/overdue/due-soon |
| T-041 | In-app notification centre | done | Bell + `/app/notifications` with read/unread |
| T-042 | Resend email templates + delivery | done | Assignment/mention/due soon/overdue when Resend configured |
| T-043 | Web Push subscribe / unsubscribe | done | Permission gated; VAPID + `/sw.js` |
| T-044 | Notification preferences | done | Profile toggles for email/push channels |

## Role suites

| ID | Task | Status | Acceptance |
| --- | --- | --- | --- |
| T-050 | Admin user management (invite/activate/deactivate) | done | Deactivate sets Inactive; sign-in blocked via is_active |
| T-051 | Admin departments + permission overview | done | Departments CRUD + static ADR-003 matrix; changes audited |
| T-052 | Admin audit log UI | done | Filterable event list on Admin |
| T-053 | Manager team board + workload | done | Scoped to is_manager teams (admins see all) |
| T-054 | Manager blocked queue | done | Shows blocker reason |
| T-055 | HR people-task queues | done | People & HR workspace; HR/Admin only via can_view_task |

## Hardening and launch

| ID | Task | Status | Acceptance |
| --- | --- | --- | --- |
| T-060 | RLS policies for all exposed tables | done | Force RLS; HR workspace policies; advisor review |
| T-061 | Server-side authorisation on mutations | done | Shared authz matrix + requireRoles; unit tests |
| T-062 | Rate limiting on auth and sensitive routes | done | Sign-in + invite limits; cron bearer secret |
| T-063 | Sentry (or equivalent) integration | done | `@sentry/nextjs` wired; DSN optional until staging |
| T-064 | Accessibility pass on core flows | done | Skip link, labels, board/list semantics |
| T-065 | Production domain + SSL | done | Cutover runbook + health route shipped; DNS/SSL pending ops |
| T-066 | Internal launch guide + support path | done | `docs/launch/INTERNAL_GUIDE.md` + `SUPPORT.md` |
| T-067 | Publish CHANGELOG 1.0.0 | done | Release notes published 2026-08-06 |

## Writing new tasks

When adding tasks:

1. Give a stable ID (`T-xxx`).
2. Link to PRD section or ADR when relevant.
3. Include clear acceptance criteria.
4. Keep implementation detail in PRs, not duplicated here.
