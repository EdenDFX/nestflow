# NestFlow Roadmap

| Field | Value |
| --- | --- |
| Product | NestFlow |
| Status | Active planning |
| Last updated | 2026-08-05 |

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
- [ ] Vercel project and `tasks.nestbyeden.com` DNS plan
- [ ] CI: lint, typecheck, unit test stub, Playwright smoke stub

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

- [x] Production domain cutover runbook (`tasks.nestbyeden.com`) + `/api/health`
- [x] Seed departments and initial users verified (20 profiles, 4 departments, General + People & HR)
- [x] Training notes / short internal guide
- [x] Support channel and incident path defined
- [x] Changelog 1.0.0 published
- [x] Supabase Free accepted for soft launch (Pro deferred)

**Exit criteria:** Employees actively creating and completing tasks in production (after DNS cutover).

## M8+ — Post-launch enhancements

Prioritised after launch feedback:

1. Recurring tasks
2. Approvals
3. Task dependencies
4. Time tracking
5. Performance / delivery reports
6. Gear-system task links
7. Passkeys / MFA
8. Advanced automation and templates

## Dependencies

| Dependency | Needed by | Notes |
| --- | --- | --- |
| Parent domain DNS access | M0 / M7 | Name.com or current nameserver provider |
| Supabase project access | M0 | Prefer shared identities, isolated NestFlow schema/tables |
| Resend NestFlow API key | M4 | Separate key from other products if possible |
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
