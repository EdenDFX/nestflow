# ADR-005 — Google Chat as a notification channel

Send NestFlow assignment, mention, due-soon, and overdue alerts into Google Chat. NestFlow stays the system of record.

| Field | Value |
| --- | --- |
| Status | Accepted |
| Date | 2026-08-14 |
| Product | NestFlow |
| Related | ADR-002 (identity stays Nest ID / password) |

## Context

Staff already work in Google Workspace (Gmail and Chat). NestFlow already fans out in-app rows, Resend email, and Web Push. Chat is the missing live channel next to those.

A full Chat app with personal DMs needs a one-time Workspace Admin install and a company Google Cloud service account. That can wait. Incoming webhooks on a Chat space often work with a staff account who can manage the space.

## Decision

Add Google Chat as an optional channel on the existing `notifyUser` fan-out.

1. NestFlow owns tasks, comments, status, and HR data. Chat cards link into NestFlow. v1 does not edit work from Chat.
2. Recipients are existing `profiles.email` values (Workspace emails). No new Chat login or Nest ID mapping.
3. **v1 delivery is a space incoming webhook** (`GOOGLE_CHAT_WEBHOOK_URL`). Posts go to one NestFlow alerts space, not private DMs.
4. Upgrade later to an org-installed Chat app + service account for personal DMs, using the same module and preference columns.
5. Credentials stay server-only. Never use `NEXT_PUBLIC_*` for Chat secrets.
6. Missing or failed Chat delivery must not block task mutations. Log and skip.
7. Users can turn Chat event types off in Profile (defaults on).

Non-goals for this ADR: Calendar sync, Drive attachments, Google SSO, two-way Chat commands, Seamless HR, NestByEden gear APIs.

## Consequences

### Positive

- Alerts can land where the team already chats, without waiting on Super Admin
- Same preference and health patterns as Resend and Web Push
- Room to add DMs later without a second product

### Negative / trade-offs

- Webhook mode is a shared space, not a private DM. Assignment cards are visible to space members
- Org policy can disable incoming webhooks
- The webhook URL is a secret; anyone with it can post to the space

## Follow-ups

- [x] Env vars in [GOOGLE_CHAT_SETUP.md](../engineering/GOOGLE_CHAT_SETUP.md) and `.env.example` (no secrets in git)
- [x] Preference columns `chat_assignment`, `chat_mention`, `chat_due_soon`, `chat_overdue`
- [x] Fan-out in `src/lib/notifications/notify.ts`
- [x] Health flag `googleChat` configured / missing
- [ ] Personal DM Chat app when IT can install it org-wide

## See Also

- [Google Chat setup](../engineering/GOOGLE_CHAT_SETUP.md)
- [Architecture](../engineering/ARCHITECTURE.md)
- [ADR-002](ADR-002-authentication.md)
