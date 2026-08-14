# NestFlow coding rules

Enforceable TypeScript, React, Next.js, testing, and security rules for this repo.

| Field | Value |
| --- | --- |
| Status | Enforceable baseline |
| Last updated | 2026-08-14 |
| Stack | Next.js App Router, TypeScript, Tailwind, shadcn/ui, Supabase |

## Overview

Follow these rules in every change. For voice and page shape in docs, see [DOCS_STYLE.md](DOCS_STYLE.md).

## 1. General

1. Prefer clarity over cleverness.
2. Keep pull requests focused.
3. Don't commit secrets (`.env`, service-role keys, private keys).
4. Follow dash-usage rules for UI copy, docs, commits, and PR text.
5. Update docs when behaviour or contracts change. Follow [DOCS_STYLE.md](DOCS_STYLE.md).

## 2. TypeScript

1. `strict` mode on.
2. No `any`. Use `unknown` and narrow.
3. Prefer `type` / discriminated unions for domain states.
4. Exhaustive `switch` for unions and enums, with a `never` default check.
5. Shared domain types live in a clear `types` or feature module, not duplicated ad hoc.

```ts
switch (status) {
  case "backlog":
  case "todo":
  case "in_progress":
  case "blocked":
  case "review":
  case "completed":
    return renderStatus(status)
  default: {
    const _exhaustive: never = status
    return _exhaustive
  }
}
```

## 3. Imports

1. Place imports at the top of the module.
2. No inline imports in function bodies unless a circular-dependency exception is documented at the import site.
3. Prefer path aliases configured for the repo.

## 4. React and Next.js

1. Server Components by default.
2. Add `"use client"` only for browser interactivity (drag and drop, local UI state, theme toggles, and similar).
3. Don't fetch secrets or privileged data in Client Components.
4. Use Server Actions for first-party mutations.
5. Use Route Handlers for webhooks, cron, and non-UI HTTP.
6. Keep route `page.tsx` files thin; push logic into features/server modules.

## 5. Validation and forms

1. Zod schemas are the source of truth for external input.
2. React Hook Form + Zod resolver for non-trivial forms.
3. Reuse schemas between client validation and server validation where practical.

## 6. Data and Supabase

1. Never expose the service-role key or Cloudflare R2 secrets to the browser.
2. Assume RLS is necessary but not sufficient; still check permissions in server code for mutations.
3. All schema changes go through migrations.
4. Use typed database helpers generated or maintained for NestFlow tables.
5. Soft-deactivate users; do not delete historical task authorship.
6. Store NestFlow attachment blobs in private Cloudflare R2; Postgres holds metadata and object keys only (ADR-004).
7. Issue short-lived signed upload/download URLs only after auth and task permission checks.

## 7. Authorisation

1. Resolve the actor once per request/action.
2. Deny by default.
3. Encode role capability checks in a shared permission module.
4. Test forbidden paths explicitly.

## 8. UI and styling

1. Use NestFlow tokens; primary brand colour is `#FF6300`.
2. Support light and dark mode for every shipped surface.
3. Prefer existing shadcn/NestFlow components before inventing new primitives.
4. Don't use icons by default; prefer text labels. When an icon is justified, use lucide-animated from `src/components/icons/`.
5. Tooltips for icon-only controls.
6. Respect reduced-motion preferences for non-essential animation.

## 9. Naming

| Thing | Convention |
| --- | --- |
| React components | PascalCase |
| Functions / variables | camelCase |
| DB tables / columns | snake_case |
| Zod schemas | `thingSchema` |
| Server Actions | verbNoun (`createTask`) |
| Feature folders | kebab-case or domain noun consistency |

Product name is **NestFlow**. “Backlog” is a task status, not the product name.

## 10. Testing

1. Unit test pure logic (transitions, permissions, schema parsing) with Vitest.
2. Component tests with React Testing Library for critical interactive pieces.
3. Playwright for login, assign, comment, complete, and role-denied paths.
4. Don't rely solely on manual clicking for permission guarantees.

## 11. Error handling

1. Map failures to stable error codes from `API.md`.
2. Log enough context server-side for debugging.
3. Show actionable user-facing messages without leaking internals.

## 12. Performance

1. Avoid shipping large Client Components for static content.
2. Paginate lists; do not load unbounded task collections.
3. Debounce search inputs.
4. Optimise board queries by workspace/status.

## 13. Git and reviews

1. Conventional, purposeful commits when requested.
2. PR description includes summary and test plan.
3. No `--no-verify` unless explicitly required by a human for a documented reason.

## 14. AI-assisted development

1. Read `docs/memory/OBSIDIAN_MEMORY.md` before large changes.
2. Don't invent statuses, roles, or stack choices that contradict ADRs/PRD.
3. Prefer updating source docs over stuffing transient chat details into memory.

## See Also

- [Documentation style](DOCS_STYLE.md)
- [Architecture](ARCHITECTURE.md)
- [Git workflow](GIT_WORKFLOW.md)
