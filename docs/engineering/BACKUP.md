# NestFlow backup and restore

How to dump and restore the `nestflow` schema on shared Supabase Free.

| Field | Value |
| --- | --- |
| Status | Operational guidance (Supabase Free) |
| Last updated | 2026-08-14 |
| Related | ADR-001, M6 hardening, M7 launch |

## Decision

NestFlow runs on the **shared NestByEden Supabase Free** project. Don't upgrade to Pro for durability. Use weekly `pg_dump` plus keep-warm crons. Point-in-time recovery isn't available on Free.

## What to protect

| Data | Location | Notes |
| --- | --- | --- |
| Auth users | Supabase Auth | Shared NestByEden project |
| Profiles / Nest IDs | `public.profiles` | Shared with gear system |
| NestFlow app data | Schema `nestflow` | Tasks, collaboration, notifications, admin |
| Attachments | Cloudflare R2 bucket | Metadata in `nestflow.attachments` |
| App config | Vercel env vars | Never commit secrets |

## Free-tier constraints (accepted)

| Constraint | NestFlow response |
| --- | --- |
| No automated PITR / daily platform backups | Weekly (or pre-migration) `pg_dump` of `nestflow` |
| Project may pause after ~7 days of inactivity | Keep production traffic or daily crons (`/api/cron/overdue` + `/api/health`; Hobby limit) so the project stays warm |
| Soft resource limits | ~20 internal users is within Free limits; watch DB size and Auth MAU |
| Shared project with gear system | Never drop shared `public.profiles` / Auth users; NestFlow stays in `nestflow` schema |

## Backup checklist (Free)

1. Before risky migrations, export NestFlow schema:

```bash
# Ops machine with DB access
pg_dump "$DATABASE_URL" --schema=nestflow --format=custom --file=nestflow-$(date +%Y%m%d).dump
```

2. Store dumps in a private ops location (not git).
3. Confirm R2 retention / versioning if attachments matter for recovery.
4. Snapshot Vercel env vars in the team password manager after each env change.

Suggested cadence while on Free: **weekly dump** + dump before every schema migration.

## Restore outline

1. Pause writes (maintenance message / freeze invites).
2. Restore with `pg_restore` into a scratch DB or carefully into the shared project (prefer scratch first).
3. Verify `nestflow` tables, RLS, and public `nf_*` views.
4. Spot-check Auth users still map to `profiles.id`.
5. Restore R2 objects if keys referenced by `attachments` are missing.
6. Smoke test: login, open task, comment, notification bell.
7. Record the drill date in `SECURITY_CHECKLIST.md`.

## R2 note

Soft-deleted attachment metadata does not immediately delete R2 objects.

## Ownership

Primary: NestFlow admin  
Escalation: Nest by Eden infrastructure owner for the shared Supabase project

## See Also

- [Security checklist](SECURITY_CHECKLIST.md)
- [Domain cutover](../launch/DOMAIN_CUTOVER.md)
