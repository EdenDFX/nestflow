# Changelog

All notable user-visible changes to NestFlow will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- M8 task enhancements: recurring rules (spawn next on complete), approvals, dependencies, time tracking, gear deep links
- Admin performance/delivery report extras (pending approvals, recurring open, hours logged, 30-day completion rate)
- Team performance grid shows logged time per person
- HR People suite: Templates & automation (task templates + simple automation rules)

### Changed

- Nothing yet

### Fixed

- Nothing yet

### Security

- Nothing yet

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
