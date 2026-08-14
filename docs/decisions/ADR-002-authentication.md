# ADR-002 — Authentication approach

Use Supabase Auth for sessions. Nest ID is identity, not a password. Access is invite-only.

| Field | Value |
| --- | --- |
| Status | Accepted |
| Date | 2026-08-05 |
| Product | NestFlow |

## Context

Requirements call for a custom and unique login experience per user identity model (Nest ID), plus invite-only access. Building a fully custom authentication engine would add password storage, session hardening, recovery, and verification burdens.

## Decision

Use **Supabase Auth** for identity and sessions.

Product rules:

1. Invite-only onboarding (no public self-registration).
2. Employees authenticate with **Nest ID or work email** plus password (v1).
3. Nest ID is a unique business identifier displayed in UI; it is **never** a password.
4. Internal primary key remains `auth.users.id`.
5. Roles and permissions live in NestFlow application tables, not user-editable auth metadata.
6. Deactivated users retain historical attribution and cannot sign in.
7. Login UI is custom-branded NestFlow (light/dark, primary `#FF6300`).
8. MFA / passkeys are deferred to a later milestone.

## Consequences

### Positive

- Reuses proven session and recovery primitives
- Aligns with ADR-001 identity reuse goal
- Allows a distinctive NestFlow login UX without inventing crypto/session code

### Negative / trade-offs

- Login identifier mapping (Nest ID → auth user) must be explicit and tested
- Password-only v1 is weaker than MFA; launch hardening must include rate limits and breach hygiene
- Custom UI must still follow Supabase session cookie / server client patterns correctly

## Follow-ups

- [x] Invite email + first-password set flow (Admin/HR invites)
- [x] Recovery channel is email-based via Supabase Auth
- [x] Auth rate limiting and inactive-user hard stop
- [ ] MFA / passkeys (T-087)
- [ ] Invite-only provisioning closed against uninvited sign-in (T-011)

## See Also

- [ADR-001](ADR-001-backend-platform.md)
- [ADR-003](ADR-003-role-access-model.md)
- [API](../engineering/API.md)
