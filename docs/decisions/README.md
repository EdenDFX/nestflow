# Architecture Decision Records

This folder stores Architecture Decision Records (ADRs) for NestFlow.

## Format

Each ADR uses:

- Title and ID (`ADR-00X`)
- Status: Proposed, Accepted, Superseded, Deprecated
- Context, Decision, Consequences
- Date

## Index

| ADR | Title | Status |
| --- | --- | --- |
| [ADR-001](ADR-001-backend-platform.md) | Backend platform and data isolation | Accepted |
| [ADR-002](ADR-002-authentication.md) | Authentication approach | Accepted |
| [ADR-003](ADR-003-role-access-model.md) | Role and access model | Accepted |
| [ADR-004](ADR-004-cloudflare-r2-attachments.md) | Cloudflare R2 for attachments and heavy storage | Accepted |

## When to write an ADR

Write an ADR when choosing or changing:

- Hosting, database, or auth provider
- Permission model fundamentals
- Notification delivery platform
- Public API strategy
- Any decision that would be expensive to reverse

Do not write ADRs for routine implementation details already covered by coding rules.
