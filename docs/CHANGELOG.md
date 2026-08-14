# Changelog

User-visible changes to NestFlow, grouped by version.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

Write entries for people who use the product. Don't list internal refactors or documentation-only work. Keep unreleased work under `[Unreleased]` until you tag a version.

## [Unreleased]

### Added

- Unified Work surface (`/app/work`) for board, list, and calendar, with a slide-over task pane
- Command palette (⌘K) over tasks and people the viewer can access
- Mentions filter on the notification inbox
- My Tasks day plan with inline status, checklist ticks, and a one-line comment
- Admin Overview Work / People modes: oversight plus full user, team, department, invite, and audit management
- Task detail assignee picker; List and Team board bulk bar for assignees, due date, and status
- Deactivate-user flow that reassigns open work before locking the account
- Role dashboards with status-coloured cards, due timers, and team roster
- lucide-animated icons (hover motion, reduced-motion respected)
- M8 task enhancements: recurring rules (spawn next on complete), approvals, dependencies, time tracking, gear deep links
- Admin performance/delivery report extras (pending approvals, recurring open, hours logged, 30-day completion rate)
- Team performance grid shows logged time per person
- HR People suite: Templates & automation (task templates + simple automation rules)

### Changed

- `/app/board`, `/app/list`, and `/app/calendar` redirect into `/app/work`
- Planned production URL is `tasks.nestbyeden.app`

## [1.0.0] - 2026-08-06

First internal production launch (roadmap M7). Runs on shared NestByEden **Supabase Free** (Pro deferred).

### Added

- NestFlow App Router product: auth (Nest ID / email), roles, workspaces, tasks
- Board, list, calendar, My Tasks, dashboard counters
- Collaboration: checklists, comments/@mentions, R2 attachments (when configured), activity
- Notifications: in-app centre, optional Resend email and Web Push, preferences, overdue cron
- Role suites: Admin, Team (managers), People (HR)
- Hardening: RLS force, authz matrix tests, sign-in/invite rate limits, Sentry wiring
- Launch pack: internal guide, support path, domain cutover runbook, `/api/health`
- Seeded departments (Account Department, Admin/Projects, Creative GFX, HR), General + People & HR workspaces, 20 profiles

### Changed

- NestFlow data isolated in `nestflow` schema with public `nf_*` views
- Attachments use Cloudflare R2; Postgres stores metadata only
- Backup guidance written for Free tier (manual `pg_dump`, keep-warm crons) instead of Pro PITR

### Security

- Force RLS on NestFlow tables; HR workspaces restricted to HR/Admin
- Server-side role guards on admin and privileged mutations
- Cron endpoints protected with `CRON_SECRET`

## Release template

```md
## [X.Y.Z] - YYYY-MM-DD

### Added
### Changed
### Fixed
### Security
```

## Version notes

- `0.x` versions may ship during internal previews.
- `1.0.0` marks the first internal production launch (roadmap M7).

## See Also

- [Git workflow](engineering/GIT_WORKFLOW.md)
- [Roadmap](product/ROADMAP.md)
