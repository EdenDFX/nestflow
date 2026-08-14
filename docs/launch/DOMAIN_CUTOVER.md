# NestFlow production domain cutover

Attach `tasks.nestbyeden.app` to the Vercel project and point Auth at that host.

Parent domain `nestbyeden.app` is already purchased (Name.com). You don't need a new registration for the subdomain.

| Field | Value |
| --- | --- |
| Target host | `tasks.nestbyeden.app` |
| Last updated | 2026-08-14 |

## 1. Vercel project

1. Create or open the NestFlow Vercel project from this repo.
2. Framework: Next.js. Build command: `pnpm build` (or `npm run build`). Install: `pnpm install` (or npm).
3. Set production env vars from `.env.example` (never commit secrets):

| Required for soft launch | Notes |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | `https://tasks.nestbyeden.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | Shared NestByEden project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key only |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; overdue cron + invites |
| `CRON_SECRET` | Bearer for `/api/cron/*` |

| Optional | Notes |
| --- | --- |
| `RESEND_*` | Email notifications |
| `R2_*` | Attachments (see `docs/engineering/R2_SETUP.md`; enable R2 in Cloudflare first) |
| `NEXT_PUBLIC_VAPID_*` / `VAPID_*` | Web Push |
| `NEXT_PUBLIC_SENTRY_DSN` | Error monitoring |

4. Confirm `vercel.json` crons are active (daily overdue scan + health check also help keep Free Supabase warm on Hobby).

## 2. DNS (Name.com)

Add one of:

**Preferred (Vercel):**

| Type | Host | Value |
| --- | --- | --- |
| CNAME | `tasks` | `cname.vercel-dns.com` |

Or follow the exact target Vercel shows under Project → Domains.

5. In Vercel → Domains, add `tasks.nestbyeden.app` and wait for SSL certificate.

## 3. Supabase Auth URLs

In the shared Supabase project Auth settings, allow:

- Site URL: `https://tasks.nestbyeden.app`
- Redirect URLs: `https://tasks.nestbyeden.app/**` and local `http://localhost:3000/**`

## 4. Smoke test after cutover

1. Open `https://tasks.nestbyeden.app/api/health` and confirm it returns ok.
2. Sign in with a Nest ID.
3. Create a task, add a comment, and open notifications.
4. Confirm Admin can open `/app/admin`.
5. Press ⌘K and search for a task.

## Cutover status

| Step | Status |
| --- | --- |
| Runbook published | done |
| Vercel project linked | pending ops |
| DNS `tasks` record | pending ops |
| SSL issued | pending ops |
| Auth redirect URLs updated | pending ops |

## See Also

- [R2 setup](../engineering/R2_SETUP.md)
- [Backup](../engineering/BACKUP.md)
- [Support](SUPPORT.md)
