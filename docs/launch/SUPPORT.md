# NestFlow support and incident path

Where employees get help, and how ops handle an outage.

| Field | Value |
| --- | --- |
| Last updated | 2026-08-14 |
| Soft launch | `1.0.0` |

## Support channel (internal)

| Priority | Channel | Who responds |
| --- | --- | --- |
| Day-to-day how-to | Nest by Eden internal chat (NestFlow thread) | Admins / Line Managers |
| Access / invite / deactivate | Admin or HR | NestFlow Admin or HR |
| Outage / cannot sign in | Ping NestFlow Admin + infrastructure owner | Admin + shared Supabase owner |

Update the concrete chat channel name here once chosen: ________

## What employees should include

- Nest ID
- Exact page URL
- What they tried
- Screenshot if useful (no passwords)

## Incident severity

| Level | Example | First response target |
| --- | --- | --- |
| SEV1 | Nobody can sign in / app down | 30 minutes |
| SEV2 | Tasks not saving / notifications broken for many users | 2 hours |
| SEV3 | Single-user access or UI bug | Next business day |

## Incident steps (ops)

1. Confirm blast radius (one user vs everyone).
2. Check Vercel deployment status and recent deploys.
3. Check Supabase project status (Free projects can pause after inactivity).
4. Check `/api/health` on production.
5. If Auth is down, coordinate with shared NestByEden Supabase owner (gear system shares Auth).
6. Post a short status note in the NestFlow chat thread.
7. After recovery, note cause and fix in CHANGELOG or audit if admin-related.

## Free-tier note

If the Supabase project paused, restore it from the Supabase dashboard. Production daily cron (`/api/cron/overdue`) and health checks reduce pause risk by generating traffic. Hobby Vercel allows at most one run per day per cron.

## Escalation contacts

| Role | Name / handle |
| --- | --- |
| NestFlow Admin | ________ |
| Infrastructure / Supabase owner | ________ |
| Vercel project owner | ________ |

## See Also

- [Internal guide](INTERNAL_GUIDE.md)
- [Domain cutover](DOMAIN_CUTOVER.md)
- [Security checklist](../engineering/SECURITY_CHECKLIST.md)
