# NestFlow Documentation

Internal documentation for **NestFlow**, the task-management platform for Nest by Eden.

| Item | Value |
| --- | --- |
| Product | NestFlow |
| Tagline | Plan. Assign. Deliver. |
| Planned URL | `tasks.nestbyeden.com` |
| Primary colour | `#FF6300` |
| Application type | Responsive web application |

## Reading order

1. [PRD](product/PRD.md)
2. [DESIGN](design/DESIGN.md)
3. [ARCHITECTURE](engineering/ARCHITECTURE.md)
4. [Architecture Decision Records](decisions/README.md)
5. [DATABASE](engineering/DATABASE.md)
6. [API](engineering/API.md)
7. [COMPONENTS](engineering/COMPONENTS.md)
8. [CODING_RULES](engineering/CODING_RULES.md)
9. [ROADMAP](product/ROADMAP.md)
10. [TASKS](product/TASKS.md)
11. [OBSIDIAN_MEMORY](memory/OBSIDIAN_MEMORY.md)
12. [CHANGELOG](CHANGELOG.md)

## Documentation map

### Product

| Document | Purpose |
| --- | --- |
| [PRD.md](product/PRD.md) | Product purpose, users, requirements, workflows, acceptance criteria |
| [ROADMAP.md](product/ROADMAP.md) | Releases, milestones, dependencies, delivery order |
| [TASKS.md](product/TASKS.md) | Actionable implementation backlog |

### Engineering

| Document | Purpose |
| --- | --- |
| [ARCHITECTURE.md](engineering/ARCHITECTURE.md) | Application structure, services, data flows, security boundaries |
| [API.md](engineering/API.md) | Server Actions, Route Handlers, webhooks, error contracts |
| [DATABASE.md](engineering/DATABASE.md) | Tables, relationships, indexes, RLS, migrations |
| [R2_SETUP.md](engineering/R2_SETUP.md) | Cloudflare R2 attachments + Supabase metadata ops |
| [ROLE_MATRIX.md](engineering/ROLE_MATRIX.md) | Capability matrix by role |
| [SECURITY_CHECKLIST.md](engineering/SECURITY_CHECKLIST.md) | M6 production readiness checklist |
| [BACKUP.md](engineering/BACKUP.md) | Backup / restore verification notes |
| [COMPONENTS.md](engineering/COMPONENTS.md) | Reusable UI components, variants, states, accessibility |
| [CODING_RULES.md](engineering/CODING_RULES.md) | Enforceable TypeScript, React, Next.js, testing, security rules |
| [GIT_WORKFLOW.md](engineering/GIT_WORKFLOW.md) | Branches, Conventional Commits, SemVer, CI/CD |

### Design

| Document | Purpose |
| --- | --- |
| [DESIGN.md](design/DESIGN.md) | Design system, colour, spacing, typography, motion, responsiveness |
| [DESIGN_DECISIONS.md](design/DESIGN_DECISIONS.md) | Reasons behind important UX and visual choices |

### Decisions

| Document | Purpose |
| --- | --- |
| [decisions/](decisions/README.md) | Architecture Decision Records (ADRs) |

### Memory

| Document | Purpose |
| --- | --- |
| [OBSIDIAN_MEMORY.md](memory/OBSIDIAN_MEMORY.md) | Stable context for AI agents across sessions |
| [PROJECT_GLOSSARY.md](memory/PROJECT_GLOSSARY.md) | Agreed meanings of product and domain terms |

### Release notes

| Document | Purpose |
| --- | --- |
| [CHANGELOG.md](CHANGELOG.md) | User-visible changes by released version |

### Launch

| Document | Purpose |
| --- | --- |
| [INTERNAL_GUIDE.md](launch/INTERNAL_GUIDE.md) | Short employee training notes |
| [SUPPORT.md](launch/SUPPORT.md) | Support channel and incident path |
| [DOMAIN_CUTOVER.md](launch/DOMAIN_CUTOVER.md) | Vercel + DNS + Auth URL cutover |
| [SECURITY_CHECKLIST.md](engineering/SECURITY_CHECKLIST.md) | Pre-launch checklist (Free tier) |
| [BACKUP.md](engineering/BACKUP.md) | Free-tier backup / restore notes |

## Conflict resolution

When two documents disagree, use this order:

1. Approved ADR
2. PRD
3. Architecture and database documentation
4. Design and component documentation
5. Coding rules
6. Roadmap
7. Tasks
8. AI / vector memory

Memory summarises approved information. It must never silently override source documents.

## Ownership

| Area | Owner |
| --- | --- |
| Product requirements | Product / operations lead |
| Architecture and ADRs | Engineering |
| Design system | Design + frontend |
| Database and API contracts | Engineering |
| Changelog | Release owner |

## Sensitive information

Do not store passwords, API keys, service-role keys, connection strings, or employee personal data in these documents.
