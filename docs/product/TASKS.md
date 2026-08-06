# NestFlow Implementation Tasks

Actionable backlog derived from the PRD and roadmap. Use this as the working checklist during build. Mark items complete only when acceptance notes are satisfied.

Status key: `todo` · `in_progress` · `blocked` · `done` · `partial`

**Rule:** Do not delete shipped UI or server actions when closing gaps. Extend or re-wire existing modules; merge into current role surfaces.

Last audit: 2026-08-06

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
| T-035 | Global search (accessible entities only) | todo | RLS respected; dedicated search surface (PRD §5.1) |

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
| T-050 | Admin user management (invite/activate/deactivate) | partial | Logic in `AdminSuite` + admin actions; `/app/admin` currently renders `AdminOversight` only (see T-070) |
| T-051 | Admin departments + permission overview | partial | Implemented inside `AdminSuite`; not on live Overview route (see T-070) |
| T-052 | Admin audit log UI | partial | Oversight Log tab + full audit in `AdminSuite` (see T-070) |
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

## PRD surface close-out (merge existing work; v1.0.x)

Do not rewrite role suites from scratch. Wire, extend, or tab-compose existing components.

| ID | Task | Status | Merge with existing | Acceptance |
| --- | --- | --- | --- | --- |
| T-070 | Re-surface full Admin management UI under Overview | todo | Keep `AdminOversight`. Re-mount `AdminSuite` (users, teams, departments, permissions, audit, invites) as additional tabs or a sibling route under `/app/admin`. Do not discard either component. | Admin can manage users/teams without losing All tasks / Log / Reports / Roles |
| T-071 | Admin org settings / branding | todo | Tokens already live in `globals.css` + theme toggle. Add org defaults panel (name display, optional future branding notes); no duplicate token system. | Admin can view (edit if safe) company defaults |
| T-072 | Admin notification templates overview | todo | Delivery already in `src/lib/notifications/email.ts` + event types. Add read-only Admin gallery of event → channel mappings; do not replace Resend send path. | Admin can see which events email/push/in-app cover |
| T-073 | Admin system health UI | todo | Keep public `/api/health`. Extend Admin panel to show same probe + env readiness flags (Resend, R2, VAPID, Sentry, cron secret present/absent; no secret values). | Admin sees integrations status beyond raw JSON |
| T-074 | Manager bulk + single reassign UI | partial | Server already accepts `assigneeIds` on `updateTaskAction`. Create dialog assigns on create. Team board filters by assignee. **Gap:** task detail still says reassignment UI expands; no multi-select bulk reassign. Wire assignee picker into `TaskDetail` and add bulk select → reassign on Team board/list. | Single and bulk reassignment work for managers/HR/admin in scope |
| T-075 | HR employee status depth | partial | People suite has Employee status tab + activate/deactivate + open task counts, invites, teams roster. Depth still missing: reassignment prompts for deactivated users with open work (ADR-003). Extend status row actions; do not replace suite. | Deactivate flow surfaces open tasks and path to reassign |
| T-076 | HR template libraries | deferred | Explicit PRD v1.1. New work only. | Repeatable onboarding/offboarding task sets (M8 T-086) |
| T-077 | Staff Mentions surface | todo | Mentions already produce in-app + channel notifications (`task_mentioned`). Add `/app/mentions` (or notifications filter deep-link) listing mention events for the user. Reuse `NotificationList` / queries; do not rebuild comment system. | Staff can open a dedicated mentions inbox |
| T-078 | Staff quick update flow | partial | My Tasks list, board status dnd, task detail checklist/comments exist. Add compact status/checklist/comment actions from My Tasks row (sheet or inline) without leaving the list when possible. | Staff can update status + checklist or comment without full navigation friction |
| T-079 | Global search | todo | Suite-local filters exist (Admin, Team performance, list query). Ship app-wide search command/page over tasks + people with RLS. Share filter helpers where useful. | Keyboard-accessible search; only visible entities returned |

### Audit snapshot (code, 2026-08-06)

| PRD surface | Verdict | Notes |
| --- | --- | --- |
| Admin org settings / branding | Not built | Brand tokens exist; no org settings screen |
| Admin notification templates | Not built as Admin UI | Shared HTML email renderer + prefs; no gallery |
| Admin system health UI | API only | `/api/health` live; no Admin dashboard |
| Admin users / depts / audit | Built but partial exposure | `admin-suite.tsx` complete; live route is oversight-only |
| Manager assign / reassign | Partial | Create assign + server reassign; bulk + detail picker missing |
| Manager board / workload / blocked | Done | `TeamSuite` + performance grid + blocked tab |
| HR queues / status / invites | Mostly done | Status depth + open-work reassignment prompt |
| HR template libraries | Deferred v1.1 | Tracked as T-076 / T-086 |
| Staff Mentions | Partial | Notify path yes; dedicated surface no |
| Staff quick update | Partial | Full task detail yes; first-class compact flow no |
| Search | Partial | Local filters only; global T-035 / T-079 |

## M8+ product enhancements (post soft-launch)

Prioritised after go-live. None of these replace v1 tasks above. Passkeys/MFA retained from earlier roadmap (not deleted).

| ID | Task | Status | Acceptance |
| --- | --- | --- | --- |
| T-080 | Recurring tasks | done | Daily/weekly/monthly rules on task; next instance spawns on complete |
| T-081 | Approvals | done | Request / approve / reject on task detail; managers/HR/admin decide |
| T-082 | Task dependencies | done | Blocked-by links; complete blocked while open deps remain |
| T-083 | Time tracking | done | Log minutes on task; totals on detail + team grid + admin reports |
| T-084 | Performance / delivery reports | done | Admin Reports + team grid extended (approvals, recurrence, time, 30d rate) |
| T-085 | Gear-system deep links | done | gear_ref / gear_url on tasks; optional NEXT_PUBLIC_GEAR_APP_URL |
| T-086 | Advanced automation + templates | done | HR templates tab + automation rules (status/create/complete triggers) |
| T-087 | Passkeys / MFA | todo | Optional stronger auth after password baseline (roadmap retained) |

## Writing new tasks

When adding tasks:

1. Give a stable ID (`T-xxx`).
2. Link to PRD section or ADR when relevant.
3. Include clear acceptance criteria.
4. Keep implementation detail in PRs, not duplicated here.
5. Prefer merging into existing components over parallel dead UIs.
