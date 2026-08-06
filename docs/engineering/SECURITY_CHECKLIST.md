# NestFlow security and reliability checklist (M6 / M7)

Last reviewed: 2026-08-06

Platform assumption: **Supabase Free** (no Pro upgrade planned). See `BACKUP.md`.

## Access control

- [x] NestFlow tables have RLS enabled
- [x] NestFlow tables use `FORCE ROW LEVEL SECURITY`
- [x] HR workspaces (`kind=hr`) hidden from non-HR / non-admin at workspace + task level
- [x] Server actions use `requireRoles` / capability checks for admin mutations
- [x] Assignment restricted to admin / line_manager / hr via shared authz matrix
- [x] Deactivated profiles (`status != Active`) cannot remain signed in
- [x] Role matrix automated tests (`pnpm test` / `vitest run`)
- [ ] Manual spot-check: staff cannot open `/app/admin`, `/app/team`, or `/app/people`

## Auth abuse

- [x] Sign-in rate limited (per IP and per identifier)
- [x] Invite creation rate limited
- [x] Cron routes require `CRON_SECRET` bearer token
- [ ] Confirm Vercel Firewall / WAF rules for production host (ops)

## Observability

- [x] Sentry wired via `@sentry/nextjs` (no-op until DSN set)
- [ ] `NEXT_PUBLIC_SENTRY_DSN` set in production (optional for soft launch)
- [ ] Test exception visible in Sentry project (when DSN set)

## Data durability (Free tier)

- [x] Backup / restore notes published for Free (`BACKUP.md`)
- [x] Pro upgrade explicitly deferred
- [ ] First weekly `pg_dump` of `nestflow` completed and stored offline
- [ ] Restore drill completed and dated below (optional before soft launch; required before high-stakes cutovers)

Restore drill date: ________  Operator: ________

## Accessibility

- [x] Skip link to main content
- [x] Board region labelled; list table caption + sort button labels
- [x] Icon nav buttons expose `aria-label`
- [ ] Keyboard walkthrough of login → My Tasks → Board → Task detail → Notifications
- [ ] Screen reader spot-check on create task dialog

## Performance

- [x] Board columns memoised; board state syncs on server refresh
- [x] List uses TanStack Table filtering/sorting client-side
- [ ] Spot-check board with 200+ tasks remains usable

## Secrets / launch env

- [x] Service role / R2 / Resend / VAPID keys never exposed to the browser
- [ ] Production env vars verified in Vercel (no placeholders)
- [ ] `NEXT_PUBLIC_APP_URL=https://tasks.nestbyeden.com`
- [ ] Daily cron configured so Free project stays warm (Hobby allows once per day)
