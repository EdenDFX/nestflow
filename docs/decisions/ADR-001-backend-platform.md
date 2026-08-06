# ADR-001 — Backend platform and data isolation

| Field | Value |
| --- | --- |
| Status | Accepted |
| Date | 2026-08-05 |
| Product | NestFlow |

## Context

Nest by Eden already operates a gear management system and related infrastructure. NestFlow needs a backend for auth, relational data, file attachments, and realtime updates without becoming a second identity island if avoidable.

Options considered:

1. Fully separate backend stack unrelated to existing Supabase usage
2. Existing Supabase project with shared identities and isolated NestFlow tables/schema
3. Brand-new dedicated Supabase project with separate auth users

## Decision

Use **Supabase** as the backend platform for NestFlow.

Prefer the **existing Supabase project and existing employee identities**, while isolating NestFlow application data:

- Dedicated NestFlow tables (optionally under a `nestflow` schema or clear prefix)
- RLS on every exposed table
- No browser exposure of the service-role key
- Reviewed migrations for all production schema changes

NestFlow attachment blobs are stored on **Cloudflare R2**, not Supabase Storage. See [ADR-004](ADR-004-cloudflare-r2-attachments.md).

If stronger isolation later proves necessary, a dedicated Supabase project may be proposed in a superseding ADR. That change would need an identity-linking plan.

## Consequences

### Positive

- Faster path to invite-only employee access
- Shared UUID identity with existing staff records where available
- One operational platform for Auth, Postgres, and Realtime
- Attachment volume handled separately on R2 (ADR-004)

### Negative / trade-offs

- Requires careful table and policy isolation inside a shared project
- Misconfigured RLS could create cross-app risk; mitigation is mandatory testing
- MCP tooling may inspect production; it must not replace migration discipline

## Follow-ups

- Confirm whether NestFlow tables live in a dedicated schema
- Document R2 object-key conventions and attachment metadata in `DATABASE.md` (see ADR-004)
- Add role-matrix RLS tests before launch
