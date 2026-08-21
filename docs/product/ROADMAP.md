# NestFlow roadmap

Milestone order from foundations through launch and post-launch enhancements.

| Field | Value |
| --- | --- |
| Product | NestFlow |
| Status | Soft launch `1.0.0` shipped; M7.1 mostly closed (T-071–T-073 open); M8 shipped except passkeys (T-087) |
| Last updated | 2026-08-14 |

## Release philosophy

Ship a secure, role-aware MVP that covers daily task work for Admin, Line Manager, HR, and Staff. Expand into automation, reporting, and gear integration only after the core loop is reliable.

## Milestone overview

```text
M0 Foundations → M1 Auth & shell → M2 Tasks core → M3 Collaboration
→ M4 Notifications → M5 Role suites → M6 Hardening → M7 Launch
→ M8+ Enhancements
```

## M0 — Foundations

**Goal:** Repository, documentation, design tokens, and platform wiring.

- [x] Docs set complete and reviewed
- [x] Next.js + Tailwind + shadcn/ui scaffold
- [x] Supabase project linkage and schema namespace plan (`nestflow` schema)
- [ ] Vercel project and `tasks.nestbyeden.app` DNS (runbook shipped; cutover ops pending)
- [x] CI: lint, typecheck, unit tests on GitHub Actions (Playwright still open)

**Exit criteria:** App deploys to a preview URL with design tokens applied.

## M1 — Authentication and application shell

**Goal:** Invite-only access and branded shell in light/dark mode.

- [x] Login with Nest ID or work email
- [x] Session handling via Supabase Auth
- [x] Role claim / membership resolution
- [x] App shell: navigation, theme toggle, responsive layout
- [x] Profile basics and sign-out

**Exit criteria:** Invited users can sign in and see role-appropriate navigation.

## M2 — Tasks core

**Goal:** Create, assign, update, and view tasks.

- [x] Workspaces / departments
- [x] Task CRUD
- [x] Statuses: Backlog, To Do, In Progress, Blocked, Review, Completed
- [x] Priority, due date, tags, description
- [x] My Tasks, Board, List views
- [x] Basic dashboard counters

**Exit criteria:** Managers can assign work; staff can update assigned tasks.

## M3 — Collaboration

**Goal:** Comments, checklists, attachments, activity.

- [x] Checklists
- [x] Comments and @mentions
- [x] Attachments via private Cloudflare R2 (metadata in Supabase)
- [x] Activity history on task detail
- [x] Calendar view

**Exit criteria:** A task can be fully collaborated on without leaving NestFlow.

## M4 — Notifications

**Goal:** Reliable email, in-app, and push alerts.

- [x] Notification event model
- [x] In-app notification centre
- [x] Resend email templates
- [x] Web Push subscription flow and delivery
- [x] Preference controls

**Exit criteria:** Assignment, mention, and overdue events deliver on enabled channels.

## M5 — Role suites

**Goal:** Admin, Line Manager, and HR specialised screens.

- [x] Admin: users, departments, permissions overview, audit log
- [x] Line Manager: team board, workload, blocked queue
- [x] HR: people task queues and employee status coordination
- [x] Permission matrix verification across roles

**Exit criteria:** Each role completes its primary workflow without privilege escalation.

## M6 — Hardening

**Goal:** Production readiness.

- [x] RLS policy review and role matrix tests
- [x] Rate limiting and auth abuse protections
- [x] Sentry (or equivalent) error monitoring
- [x] Backup / restore verification notes
- [x] Accessibility pass on core flows
- [x] Performance pass on board and list views

**Exit criteria:** Security and reliability checklist signed off.

## M7 — Launch

**Goal:** Soft launch to internal employees.

- [x] Production domain cutover runbook (`tasks.nestbyeden.app`) + `/api/health`
- [x] Seed departments and initial users verified (20 profiles, 4 departments, General + People & HR)
- [x] Training notes / short internal guide
- [x] Support channel and incident path defined
- [x] Changelog 1.0.0 published
- [x] Supabase Free accepted for soft launch (Pro deferred)

**Exit criteria:** Employees actively creating and completing tasks in production (after DNS cutover).

## M7.1 — PRD surface close-out (merge existing work)

**Goal:** Close PRD §5 gaps without deleting role suite work shipped in M5–M7.

**Principle:** Extend and re-wire. Never drop `AdminOversight`, `AdminSuite`, team/people suites, or task collaboration modules.

| Area | Current state | Merge plan |
| --- | --- | --- |
| Admin management | Done. `AdminConsole` Work (`AdminOversight`) + People (`AdminSuite`) on `/app/admin` | Keep both; do not delete (T-070) |
| Admin org / branding | Design tokens only | Lightweight org settings panel (T-071) |
| Admin notification templates | Shared Resend HTML + prefs | Read-only Admin overview of event → channel (T-072) |
| Admin system health | `/api/health` only | Admin UI on top of health probe + env readiness (T-073) |
| Manager assign | Done. Detail picker + bulk assign / due / status on List and Team board | T-074 |
| HR status | Done. Deactivate prompts for open work / reassignment | T-075 |
| HR templates | Done in M8 | People → Templates & automation (T-086) |
| Staff mentions | Done. Inbox filter `?filter=mentions` | T-077 |
| Staff quick update | Done. My Tasks day plan + inline status, checklist, comment | T-078 |
| Global search | Done. Command palette (⌘K) over tasks + people | T-079 / T-035 |

**Exit criteria:** PRD §5 surfaces for Admin, Manager, HR, and Staff are usable or explicitly deferred with task IDs; no existing suite code removed.

## M8+ — Post-launch enhancements

| Priority | Enhancement | Task | Status | Notes |
| --- | --- | --- | --- | --- |
| 1 | Recurring tasks | T-080 | done | Rule on task; spawn on complete |
| 2 | Approvals | T-081 | done | Request / approve / reject |
| 3 | Task dependencies | T-082 | done | Blocks complete while open deps remain |
| 4 | Time tracking | T-083 | done | Minutes on task + report rollups |
| 5 | Performance / delivery reports | T-084 | done | Admin Reports + team performance grids extended |
| 6 | Gear-system deep links | T-085 | done | gear_ref / gear_url + optional base URL |
| 7 | Advanced automation + templates | T-086 | done | People → Templates & automation |
| 8 | Passkeys / MFA | T-087 | open | Stronger auth after password baseline |
| 9 | Google Chat notifications | T-088 | done | Space webhook cards (ADR-005). Personal DMs later. |
| 10 | Staff period reports + digests | T-089 | done | Daily/weekly/monthly charts + digests for LM/HR/Admin |

M8 does not include deep gear inventory, public signup, native apps, or full HRIS (PRD non-goals).

## Dependencies

| Dependency | Needed by | Notes |
| --- | --- | --- |
| Parent domain DNS access | M0 / M7 | Name.com or current nameserver provider |
| Supabase project access | M0 | Prefer shared identities, isolated NestFlow schema/tables |
| Google Chat space webhook | T-088 | Optional Chat cards; `GOOGLE_CHAT_*` (ADR-005) |
| Cloudflare R2 bucket | M3 | Private NestFlow attachments (ADR-004) |
| Vercel project | M0 | Custom domain attachment |
| Employee Nest ID source of truth | M1 | Must be unique and stable |

## Risks

| Risk | Mitigation |
| --- | --- |
| Brand confusion with external “Backlog” products | Product named NestFlow; Backlog is a status only |
| Permission bugs across four roles | Matrix tests + RLS + server checks |
| Notification fatigue | Preference controls and high-signal default events |
| Scope creep into HRIS / gear platform | Explicit non-goals in PRD |

## Timeline guidance

Exact calendar dates should be set after team capacity is confirmed. Suggested sequencing is sequential through M7, with design polish continuous from M1.

## See Also

- [PRD](PRD.md)
- [Tasks](TASKS.md)
- [Changelog](../CHANGELOG.md)
