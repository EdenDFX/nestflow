# NestFlow

Internal task management for Nest by Eden.

**Plan. Assign. Deliver.**

| Item | Value |
| --- | --- |
| Repo | https://github.com/EdenDFX/nestflow |
| URL (planned) | `tasks.nestbyeden.app` |
| Version | `1.0.0` (soft launch). Later work is listed under `[Unreleased]` in [docs/CHANGELOG.md](docs/CHANGELOG.md) |
| Primary colour | `#FF6300` |
| Stack | Next.js, Tailwind, shadcn/ui, Supabase (Free), Cloudflare R2 |

## Documentation

Start at [docs/README.md](docs/README.md).

- Product: [PRD](docs/product/PRD.md) · [Roadmap](docs/product/ROADMAP.md) · [Tasks](docs/product/TASKS.md)
- Release notes: [Changelog](docs/CHANGELOG.md)
- Launch: [Internal guide](docs/launch/INTERNAL_GUIDE.md) · [Domain cutover](docs/launch/DOMAIN_CUTOVER.md)
- Git / CI: [Git workflow](docs/engineering/GIT_WORKFLOW.md)

## Develop

1. Run `pnpm install`.
2. Copy `.env.example` to `.env.local` and fill in values. Don't commit secrets.
3. Run `pnpm dev`.
4. Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Local development |
| `pnpm build` | Production build |
| `pnpm start` | Run production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript check |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm test:watch` | Vitest watch mode |
| `pnpm r2:setup` | Create/configure the R2 attachments bucket |

## Branching and releases

Short version:

- `main` = production-ready
- `feature/*` / `fix/*` via pull requests
- Conventional Commits (`feat:`, `fix:`, `docs:`, …)
- SemVer in `package.json` + `docs/CHANGELOG.md`

Full process: [docs/engineering/GIT_WORKFLOW.md](docs/engineering/GIT_WORKFLOW.md).

## Project layout

```text
src/
  app/                 # App Router pages + API routes
  components/          # UI, NestFlow surfaces, lucide-animated icons
  lib/                 # Auth, tasks, notifications, security
docs/                  # Product and engineering documentation
.github/workflows/     # CI
```

## Notes

- Do not commit `.env.local` or service-role / R2 / VAPID secrets.
- Soft launch targets Supabase Free (shared NestByEden project); Pro is deferred.
- Documentation style: [docs/engineering/DOCS_STYLE.md](docs/engineering/DOCS_STYLE.md).
