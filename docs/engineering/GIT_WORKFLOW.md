# NestFlow git workflow

Branches, commit messages, SemVer, and CI for this repo.

| Field | Value |
| --- | --- |
| Default remote | `origin` → `https://github.com/EdenDFX/nestflow.git` |
| Default branch | `main` (production-ready) |
| Integration branch | `develop` (optional but recommended) |
| Last updated | 2026-08-14 |

## Overview

Use short-lived feature branches and pull requests. Record user-visible work in [CHANGELOG.md](../CHANGELOG.md) under `[Unreleased]` until you tag a release.

## Branch model

```text
main          ← production / release-ready
  └── develop ← integration (optional)
        ├── feature/short-name
        ├── fix/short-name
        └── chore/short-name
```

| Branch | Purpose | Deploys to |
| --- | --- | --- |
| `main` | Stable, releasable code | Vercel **Production** (`tasks.nestbyeden.app`) |
| `develop` | Integration of finished work | Vercel **Preview** (optional) |
| `feature/*` | New work | PR preview |
| `fix/*` | Bug fixes | PR preview |
| `chore/*` | Tooling, CI, deps | PR preview |
| `hotfix/*` | Urgent production fix off `main` | PR → `main` |

### Rules of thumb

1. Never commit directly to `main` once the team is collaborating (use PRs).
2. Keep branches short-lived (hours/days, not weeks).
3. One PR ≈ one coherent change that can be reviewed and reverted.
4. Delete remote branches after merge.

## Commit messages (Conventional Commits)

Format:

```text
type(scope): short summary in imperative mood

Optional body explaining why.
```

| Type | Use for |
| --- | --- |
| `feat` | User-visible feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `refactor` | Internal restructure |
| `test` | Tests only |
| `chore` | Build, CI, deps |
| `security` | Authz / secrets / RLS |
| `perf` | Performance |

Examples:

```text
feat(tasks): allow blocked status only with reason
fix(auth): block inactive profiles after password sign-in
docs(launch): add domain cutover checklist
chore(ci): add typecheck and vitest to GitHub Actions
```

Do **not** use vague messages like `update`, `wip`, or `fix stuff`.

## Pull requests

1. Open PR into `develop` (or `main` if you skip `develop`).
2. Fill the PR template.
3. Wait for CI (lint, typecheck, test, build).
4. Prefer squash-merge for a clean `main` history, or merge commits if you want full branch history.
5. Tag releases from `main` (see versioning).

## Versioning (SemVer + CHANGELOG)

NestFlow follows [SemVer](https://semver.org/) and [Keep a Changelog](https://keepachangelog.com/).

| Change | Bump | Example |
| --- | --- | --- |
| Breaking workflow / API for operators | `MAJOR` | `2.0.0` |
| New capability | `MINOR` | `1.1.0` |
| Bug fix / patch | `PATCH` | `1.0.1` |

Process:

1. Land work on `main`.
2. Update `docs/CHANGELOG.md` under `[Unreleased]`, then move entries into a dated version section when releasing.
3. Bump `package.json` `version` to match.
4. Create a git tag: `git tag -a v1.0.1 -m "v1.0.1"` and push tags: `git push origin v1.0.1`.

Current soft-launch release: **`1.0.0`**.

## CI/CD recommendation

| Stage | Tool | Trigger |
| --- | --- | --- |
| Quality gate | GitHub Actions (`.github/workflows/ci.yml`) | PR + push to `main`/`develop` |
| Preview deploy | Vercel | Every PR |
| Production deploy | Vercel | Push / merge to `main` |

### Suggested GitHub settings (one-time in the UI)

1. **Settings → Branches → Branch protection** on `main`:
   - Require PR before merge
   - Require status checks: CI job
   - Require linear history (if using squash)
2. **Settings → Actions**: allow GitHub Actions.
3. Connect the repo to Vercel; set Production Branch = `main`.

## Secrets

Never commit:

- `.env.local`
- Supabase service role
- R2 / Resend / VAPID private keys
- `CRON_SECRET`

Only `.env.example` is tracked. Production secrets live in Vercel project settings.

## Day-to-day commands

```bash
git checkout develop
git pull
git checkout -b feature/calendar-filters
# ... work ...
git add -A
git commit -m "feat(calendar): filter by assignee"
git push -u origin HEAD
# Open a pull request on GitHub
```

## See Also

- [Changelog](../CHANGELOG.md)
- [Coding rules](CODING_RULES.md)
- [Documentation style](DOCS_STYLE.md)
