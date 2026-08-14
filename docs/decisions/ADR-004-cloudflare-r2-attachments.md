# ADR-004 — Cloudflare R2 for attachments and heavy storage

Store NestFlow file blobs in private Cloudflare R2. Keep metadata in Postgres.

| Field | Value |
| --- | --- |
| Status | Accepted |
| Date | 2026-08-05 |
| Product | NestFlow |
| Supersedes (partial) | ADR-001 NestFlow attachment Storage bucket guidance |

## Context

NestFlow and NestByEden share one Supabase project on the free tier. That plan includes about 1 GB of file storage. NestFlow needs private task attachments (images, PDFs, and other heavy files). Putting those blobs in Supabase Storage would compete with NestByEden assets and risk hitting the free file quota quickly.

Options considered:

1. Supabase Storage private bucket for NestFlow attachments
2. Cloudflare R2 private bucket for NestFlow attachments; Postgres stores metadata only
3. A separate object store later, after launch

## Decision

Use **Cloudflare R2** as the primary store for NestFlow attachments and other heavy binary objects.

Rules:

1. R2 buckets are **private**. No public object ACLs for task files.
2. Uploads and downloads use **short-lived signed URLs** issued by NestFlow server code after auth and permission checks.
3. Supabase Postgres stores **metadata only** (object key, filename, mime type, size, task id, uploader, soft-delete flags).
4. R2 credentials and signing secrets never ship to the browser.
5. Enforce upload limits (size and allowed mime types) on the server.
6. Soft-delete metadata first; hard-delete the R2 object in a deferred cleanup path.
7. NestByEden gear image buckets on Supabase Storage remain unchanged for now.
8. Small NestFlow UI assets may stay in the app bundle or a light public CDN path; user-generated heavy content goes to R2.

This refines ADR-001: NestFlow still uses the shared Supabase project for Auth, Postgres, and Realtime, but NestFlow attachment blobs live on R2 instead of a Supabase Storage bucket.

## Consequences

### Positive

- Protects Supabase free-tier file quota for NestByEden
- Clear separation between relational data and heavy objects
- Private-by-default attachment security model
- Room to grow attachment volume without immediately upgrading Supabase storage

### Negative / trade-offs

- Extra service to provision (R2 bucket, API tokens, env vars on Vercel)
- Attachment access path is application-mediated, not Supabase Storage RLS alone
- Cleanup jobs must remove orphaned R2 objects when metadata is purged

## Follow-ups

- [x] Env vars documented in [R2_SETUP.md](../engineering/R2_SETUP.md) and `.env.example` (no secrets in git)
- [x] Max upload size (25 MB) and allowed types in [API.md](../engineering/API.md)
- [x] Attachments task references R2 (T-032)
- [ ] Playwright coverage for attachment upload and permission

## See Also

- [R2 setup](../engineering/R2_SETUP.md)
- [ADR-001](ADR-001-backend-platform.md)
- [Database](../engineering/DATABASE.md)
