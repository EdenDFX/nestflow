# NestFlow documentation

Internal documentation for NestFlow, the task-management platform for Nest by Eden.

| Field | Value |
| --- | --- |
| Product | NestFlow |
| Tagline | Plan. Assign. Deliver. |
| Planned URL | `tasks.nestbyeden.app` |
| Primary colour | `#FF6300` |
| Application type | Responsive web application |
| Soft launch | `1.0.0` (2026-08-06) |
| Last audited | 2026-08-14 |

## Overview

Start here when you join the project, ship a change, or need a contract. Read the style guide before you edit docs. Follow the product documents in the order below if you are new.

Writing rules live in [DOCS_STYLE.md](engineering/DOCS_STYLE.md). They follow the Apple Style Guide and DocC page shape: abstract, overview, how-to, reference, See Also.

## Get started

1. Read the [PRD](product/PRD.md) for purpose, roles, and v1 scope.
2. Skim [OBSIDIAN_MEMORY.md](memory/OBSIDIAN_MEMORY.md) for approved facts.
3. Install and run the app from the [root README](../README.md).
4. Follow [CODING_RULES.md](engineering/CODING_RULES.md) while you implement.
5. Record user-visible work in [CHANGELOG.md](CHANGELOG.md) under `[Unreleased]`.

> **Important:** Don't commit `.env.local`, service-role keys, R2 secrets, or VAPID private keys.

## Topics

### Essentials

- [PRD](product/PRD.md): Product purpose, users, workflows, and acceptance
- [Documentation style](engineering/DOCS_STYLE.md): Voice, page shape, and audit rules
- [Coding rules](engineering/CODING_RULES.md): Enforceable TypeScript, React, and security rules
- [Glossary](memory/PROJECT_GLOSSARY.md): Agreed product and domain terms
- [Memory](memory/OBSIDIAN_MEMORY.md): Durable facts for agents and new sessions

### Guides

- [Design](design/DESIGN.md): Colour, type, motion, and layout
- [Architecture](engineering/ARCHITECTURE.md): App structure, data flows, and security boundaries
- [Git workflow](engineering/GIT_WORKFLOW.md): Branches, Conventional Commits, SemVer, and CI
- [R2 setup](engineering/R2_SETUP.md): Private attachments on Cloudflare R2
- [Roadmap](product/ROADMAP.md): Milestones and delivery order
- [Tasks](product/TASKS.md): Implementation backlog

### Reference

- [API](engineering/API.md): Server Actions, Route Handlers, and error codes
- [Database](engineering/DATABASE.md): Tables, RLS, views, and migrations
- [Components](engineering/COMPONENTS.md): UI building blocks and states
- [Role matrix](engineering/ROLE_MATRIX.md): Capabilities by role
- [Changelog](CHANGELOG.md): User-visible changes by version

### Decisions

- [ADR index](decisions/README.md): Architecture Decision Records
- [Design decisions](design/DESIGN_DECISIONS.md): UX and visual choices

### Launch

- [Internal guide](launch/INTERNAL_GUIDE.md): Employee how-to
- [Support](launch/SUPPORT.md): Support channel and incident path
- [Domain cutover](launch/DOMAIN_CUTOVER.md): Vercel, DNS, and Auth URLs
- [Security checklist](engineering/SECURITY_CHECKLIST.md): Production readiness
- [Backup](engineering/BACKUP.md): Free-tier dump and restore

## Conflict resolution

When two documents disagree, use this order:

1. Approved ADR
2. PRD
3. Architecture and database documentation
4. Design and component documentation
5. Coding rules and documentation style
6. Roadmap
7. Tasks
8. Memory

Memory summarises approved information. It must never silently override source documents.

## Ownership

| Area | Owner |
| --- | --- |
| Product requirements | Product / operations lead |
| Architecture and ADRs | Engineering |
| Design system | Design + frontend |
| Database and API contracts | Engineering |
| Changelog | Release owner |
| Documentation style | Engineering |

## Sensitive information

Don't store passwords, API keys, service-role keys, connection strings, or employee personal data in these documents.

## See Also

- [Root README](../README.md)
- [Apple Style Guide](https://support.apple.com/guide/applestyleguide/welcome/web)
