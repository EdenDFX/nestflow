# NestFlow production domain cutover

Target host: **`tasks.nestbyeden.com`**

Parent domain `nestbyeden.com` is already purchased (Name.com). Subdomain does not need a new registration.

## 1. Vercel project

1. Create or open the NestFlow Vercel project from this repo.
2. Framework: Next.js. Build command: `pnpm build` (or `npm run build`). Install: `pnpm install` (or npm).
3. Set production env vars from `.env.example` (never commit secrets):

| Required for soft launch | Notes |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | `https://tasks.nestbyeden.com` |
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

5. In Vercel → Domains, add `tasks.nestbyeden.com` and wait for SSL certificate.

## 3. Supabase Auth URLs

In the shared Supabase project Auth settings, allow:

- Site URL: `https://tasks.nestbyeden.com`
- Redirect URLs: `https://tasks.nestbyeden.com/**` and local `http://localhost:3000/**`

## 4. Smoke test after cutover

1. `https://tasks.nestbyeden.com/api/health` returns ok.
2. Login with Nest ID.
3. Create task, comment, open notifications.
4. Admin can open `/app/admin`.

## Cutover status

| Step | Status |
| --- | --- |
| Runbook published | done |
| Vercel project linked | pending ops |
| DNS `tasks` record | pending ops |
| SSL issued | pending ops |
| Auth redirect URLs updated | pending ops |
