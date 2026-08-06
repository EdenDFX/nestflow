# NestFlow

Internal task management for Nest by Eden.

**Plan. Assign. Deliver.**

| Item | Value |
| --- | --- |
| Repo | https://github.com/EdenDFX/nestflow |
| URL (planned) | `tasks.nestbyeden.com` |
| Version | `1.0.0` |
| Primary colour | `#FF6300` |
| Stack | Next.js, Tailwind, shadcn/ui, Supabase (Free), Cloudflare R2 |

## Documentation

Start at [docs/README.md](docs/README.md).

- Product: [PRD](docs/product/PRD.md) · [Roadmap](docs/product/ROADMAP.md)
- Launch: [Internal guide](docs/launch/INTERNAL_GUIDE.md) · [Domain cutover](docs/launch/DOMAIN_CUTOVER.md)
- Git / CI: [Git workflow](docs/engineering/GIT_WORKFLOW.md)

## Develop

```bash
pnpm install
cp .env.example .env.local   # fill values
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Local development |
| `pnpm build` | Production build |
| `pnpm start` | Run production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript check |
| `pnpm test` | Unit tests (Vitest) |

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
  components/          # UI and NestFlow components
  lib/                 # Auth, tasks, notifications, security
docs/                  # Product and engineering documentation
.github/workflows/     # CI
```

## Notes

- Do not commit `.env.local` or service-role / R2 / VAPID secrets.
- Soft launch targets Supabase Free (shared NestByEden project); Pro is deferred.
