# NestFlow R2 + Supabase attachment setup

NestFlow keeps **file blobs in Cloudflare R2** and **metadata in Supabase Postgres** (ADR-004). There is no Supabase Storage bucket for NestFlow attachments: upload inserts `nestflow.attachments` / `nf_attachments`, then the browser PUTs to a signed R2 URL.

## Architecture

```
Browser                NestFlow server              R2                         Supabase
  │                          │                       │                             │
  │  create upload URL       │                       │                             │
  ├─────────────────────────►│  insert metadata ─────┼────────────────────────────►│
  │◄── signed PUT URL ───────┤                       │                             │
  │  PUT file ───────────────┼──────────────────────►│                             │
  │  download URL            │  signed GET ─────────►│                             │
  │  remove                  │  soft-delete row ──────┼────────────────────────────►│
  │                          │  delete object ──────►│                             │
```

Object keys: `tasks/{task_id}/{attachment_id}/{safe_file_name}`

Env vars (server only):

| Variable | Purpose |
| --- | --- |
| `R2_ACCOUNT_ID` | Cloudflare account id |
| `R2_ACCESS_KEY_ID` | R2 S3 Access Key ID |
| `R2_SECRET_ACCESS_KEY` | R2 S3 Secret Access Key |
| `R2_BUCKET` | `nestflow-attachments` |
| `R2_ENDPOINT` | `https://{account_id}.r2.cloudflarestorage.com` |

## Current status (2026-08-06)

| Layer | Status |
| --- | --- |
| Supabase `nestflow.attachments` + `nf_attachments` + RLS | Ready |
| App upload / download / soft-delete | Ready |
| Cloudflare R2 product | Enabled |
| Bucket `nestflow-attachments` | Ready (**EU** jurisdiction) |
| S3 endpoint | `https://{account_id}.eu.r2.cloudflarestorage.com` (required for EU) |
| CORS (localhost + production) | Applied via `pnpm r2:setup` |
| Signed PUT/GET smoke test | Passed |

Set `R2_ENDPOINT` explicitly for EU buckets. Do not use the default non-jurisdiction endpoint for this bucket.

## Finish setup (manual, ~5 minutes)

### 1. Confirm account

1. Open [R2 Overview](https://dash.cloudflare.com/?to=/:account/r2/overview) while logged in as the NestFlow / NestByEden Cloudflare account.
2. Copy **Account ID** from the right-hand sidebar. It should match `e8ad69c440469eed2f56e3a54860deb1` (or update `R2_ACCOUNT_ID` / `R2_ENDPOINT` to the account you actually use).
3. Confirm bucket **`nestflow-attachments`** exists under that account (recreate if needed; leave private; do not enable public `r2.dev` access).

### 2. Create R2 API token (S3 keys)

1. R2 overview → **Account details** → **API Tokens** → **Manage**.
2. Create token with **Object Read & Write** (scope to `nestflow-attachments` if offered).
3. Copy **Access Key ID** and **Secret Access Key** once.
4. Paste into `.env.local` (and Vercel later):

```bash
R2_ACCOUNT_ID=<your-account-id>
R2_ACCESS_KEY_ID=<access-key-id>
R2_SECRET_ACCESS_KEY=<secret-access-key>
R2_BUCKET=nestflow-attachments
R2_ENDPOINT=https://<your-account-id>.r2.cloudflarestorage.com
```

Docs: [R2 authentication](https://developers.cloudflare.com/r2/api/tokens/).

### 3. Apply CORS + verify with script

Browser signed uploads require CORS. From the repo root:

```bash
pnpm r2:setup
```

This uses S3 credentials to:

1. Head (or create) bucket `nestflow-attachments`
2. Set CORS for `http://localhost:3000` and `https://tasks.nestbyeden.app` (`GET`, `PUT`, `HEAD`, header `Content-Type`)

Or set the same CORS in the dashboard: bucket → **Settings** → **CORS policy**.

### 4. Restart and smoke-test

1. Restart `pnpm dev`.
2. Open a task → Attachments → upload a small PDF/PNG (≤ 25 MB).
3. Confirm object under `tasks/...` in R2 and a row in `nestflow.attachments`.

## Supabase side (already applied)

- Table `nestflow.attachments` (metadata + `object_key`)
- View `public.nf_attachments`
- RLS select / insert / update

No NestFlow buckets on Supabase Storage.

## Vercel

Add the same `R2_*` keys on the Vercel project. Never use `NEXT_PUBLIC_*` for R2 secrets.
