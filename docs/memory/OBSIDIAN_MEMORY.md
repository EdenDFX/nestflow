# NestFlow Obsidian / Vector Memory

Stable project memory for AI agents and future sessions. Store only approved, durable facts.

**Do not store:** passwords, API keys, service-role keys, connection strings, employee personal data, or transient chat speculation.

When this file disagrees with an ADR or PRD, the ADR/PRD wins. Update this file after decisions are accepted.

Last reviewed: 2026-08-06

## Product

- Name: NestFlow
- Tagline: Plan. Assign. Deliver.
- Planned URL: `tasks.nestbyeden.app`
- Parent domain: `nestbyeden.app` (purchased via Name.com)
- Separate from gear management system; optional gear links later
- “Backlog” is a task status, not the product name

## Brand / UI

- Primary colour: `#FF6300`
- Modes: light and dark
- Board-first productivity UI with tooltips, hover states, selective motion
- Icons: sparse by default; lucide-animated (Lucide + Motion hover) when justified (DD-007)
- Responsive web app
- Custom branded login using Nest ID or work email

## Roles

- Administrator
- Line Manager
- HR
- Staff

## Task statuses

Backlog → To Do → In Progress → Blocked → Review → Completed

(Blocked requires a reason; illegal transitions rejected.)

## Approved stack

- Next.js App Router + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase Auth, Postgres, Realtime (shared NestByEden project)
- Cloudflare R2 for NestFlow attachments / heavy files (ADR-004)
- React Hook Form + Zod
- TanStack Table
- dnd-kit
- Motion for React (selective)
- Resend (email)
- Web Push API
- Vitest + Playwright
- Vercel
- pnpm
- Fonts: Outfit (heading), Geist Sans / Mono (UI)
- Primary token live in `src/app/globals.css`: `#FF6300`

## Architecture decisions (accepted)

- ADR-001: Supabase backend; prefer existing project + isolated NestFlow data
- ADR-002: Supabase Auth; Nest ID is identity, not password; invite-only
- ADR-003: Role + team membership; enforce UI + server + RLS
- ADR-004: Cloudflare R2 for attachments and heavy storage; Postgres metadata only

## Documentation hierarchy

1. Approved ADR
2. PRD
3. Architecture / Database
4. Design / Components
5. Coding rules
6. Roadmap
7. Tasks
8. This memory file

## Notifications (v1 intent)

- Email, in-app, web push
- Events: assignment, mention, due soon/overdue, invite
- User preferences where operationally allowed

## Open questions

- Exact gear-system production URL and host
- Employee count / department list
- Whether HR spaces are private from Line Managers by default
- Whether Staff can create tasks in v1
- Formal Nest ID assignment process (currently backfilled from email local-part)

## Schema decisions (accepted in M1)

- Dedicated Postgres schema: `nestflow`
- NestFlow roles in `nestflow.user_roles` (separate from gear `profiles.role`)
- `public.profiles.nest_id` added and backfilled from email local-part where missing
- M2 task tables in `nestflow` with public `nf_*` views
- Default seeded workspace: General
- M3 collaboration tables: checklist_items, comments, attachments, activity_events (+ `nf_*` views)
- Attachments: R2 EU bucket `nestflow-attachments` with signed URLs; set `R2_*` including `R2_ENDPOINT=https://{account_id}.eu.r2.cloudflarestorage.com`. Supabase stores metadata only (`nestflow.attachments` / `nf_attachments`). Setup: `docs/engineering/R2_SETUP.md`, `pnpm r2:setup`.
- M4 notifications: in-app + Resend + Web Push; prefs on profile; cron `/api/cron/overdue`
- Notification delivery needs `RESEND_*`, VAPID keys, `CRON_SECRET`, and `SUPABASE_SERVICE_ROLE_KEY` (for overdue scan)
- M5 role suites live at `/app/admin`, `/app/team`, `/app/people`
- Assign `line_manager` / `hr` roles from Admin to unlock those suites (seed currently has admin + staff)
- Seed teams: Creative (Chide LM), CRM (Kehinde LM), Project (Adira LM)
- Adira: NestByEden gear Admin unchanged; NestFlow role is `line_manager` only (Project Team)
- Ecktale (hr@): NestFlow role is `hr` (NestByEden gear Admin may remain separately)
- Line managers only see/assign people on teams where `is_manager`; HR/Admin assign roster via Admin → Teams
- HR tasks use workspace kind `hr` (`People & HR`); visibility limited to HR + Admin
- M6: force RLS, authz tests (`pnpm test`), rate limits, Sentry (set `NEXT_PUBLIC_SENTRY_DSN`), backup notes in `docs/engineering/BACKUP.md`
- Supabase **Free** accepted for soft launch; Pro upgrade deferred. Use weekly `pg_dump` + keep-warm crons (see BACKUP.md)
- M7 launch pack: `docs/launch/` (internal guide, support, domain cutover); CHANGELOG `1.0.0`; `/api/health`
- Seed verified: 20 profiles, departments Account/Admin-Projects/Creative GFX/HR, workspaces General + People & HR
- Remaining ops for go-live: Vercel env + DNS CNAME `tasks` → Vercel, Auth redirect URLs (DOMAIN_CUTOVER.md)
- M7.1 PRD surface close-out (merge only; do not delete suites): T-070–T-079 in `docs/product/TASKS.md`
- `AdminOversight` is live `/app/admin`; `AdminSuite` still exists and must be re-wired, not deleted
- Manager reassign works in `updateTaskAction`; task detail UI still incomplete for assignee picker / bulk
- Global search, Staff Mentions surface, Admin health/templates/org settings remain open
- M8+ shipped (except passkeys/MFA T-087): recurring, approvals, dependencies, time tracking, extended reports, gear links, templates + automation
- M8 tables: task_dependencies, time_entries, task_templates, automation_rules (+ task columns for recurrence/approval/gear)
- Optional `NEXT_PUBLIC_GEAR_APP_URL` for gear deep links
- Templates/automation UI: People suite → Templates & automation tab
- Task detail M8 panel: recurrence, deps, time, approval, gear

## Reading pointers

- Docs index: `docs/README.md`
- PRD: `docs/product/PRD.md`
- Architecture: `docs/engineering/ARCHITECTURE.md`
- Coding rules: `docs/engineering/CODING_RULES.md`
- Glossary: `docs/memory/PROJECT_GLOSSARY.md`
