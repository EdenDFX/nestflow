# NestFlow Design Decisions

Record significant UX and visual choices here. For infrastructure or backend choices, use ADRs in `docs/decisions/`.

## DD-001 — Product name is NestFlow; Backlog is a status

| Field | Value |
| --- | --- |
| Status | Accepted |
| Date | 2026-08-05 |

### Context

“Backlog” describes unscheduled work, but an established project-management product already uses that name.

### Decision

- Product name: **NestFlow**
- “Backlog” remains an internal task status only
- Tagline: Plan. Assign. Deliver.

### Consequences

Marketing, login, docs, and UI chrome use NestFlow. Avoid naming routes or packages `backlog` as the product identity.

---

## DD-002 — Primary brand colour `#FF6300` with light and dark modes

| Field | Value |
| --- | --- |
| Status | Accepted |
| Date | 2026-08-05 |

### Context

The company wants a distinctive orange primary aligned with Nest by Eden energy, with full light/dark support.

### Decision

- Primary: `#FF6300`
- Themes: light and dark from day one
- Primary used for actions and accents, not every status

### Consequences

Design tokens and shadcn theme variables must include both modes before feature UI ships.

---

## DD-003 — Board-first productivity UI with rich interaction details

| Field | Value |
| --- | --- |
| Status | Accepted |
| Date | 2026-08-05 |

### Context

Reference UI emphasises kanban-style columns, task cards, and interactive polish (hover, tooltips, motion).

### Decision

- Provide Board, List, Calendar, and My Tasks views
- Use dynamic components, tooltips, and selective animation
- Prefer operational density over marketing-card grids for core work surfaces

### Consequences

dnd-kit, Motion, and tooltip patterns are first-class. Accessibility alternatives for drag-and-drop are mandatory.

---

## DD-004 — Unique Nest ID login presentation

| Field | Value |
| --- | --- |
| Status | Accepted |
| Date | 2026-08-05 |

### Context

Employees already have Nest identifiers. The login should feel NestFlow-specific, not a generic auth template.

### Decision

- Login accepts Nest ID or work email
- Custom NestFlow-branded auth screens
- Nest ID is visible identity, not a password

### Consequences

Auth UI is a designed product surface. Copy and layout should reinforce NestFlow identity.

---

## DD-005 — Cards used for tasks, not as the default page layout

| Field | Value |
| --- | --- |
| Status | Accepted |
| Date | 2026-08-05 |

### Context

Task boards naturally use cards. Broader page layouts should stay cleaner.

### Decision

- Task cards on boards are allowed and expected
- Avoid wrapping every dashboard section in decorative cards
- Prefer open layout for settings and forms unless interaction needs a container

### Consequences

Component docs distinguish `TaskCard` from generic card spam.

---

## DD-006 — Role-specific suites share one design system

| Field | Value |
| --- | --- |
| Status | Accepted |
| Date | 2026-08-05 |

### Context

Admin, Line Manager, HR, and Staff need different screens but one product feel.

### Decision

- One shell and token set
- Role suites differ by navigation items and permitted views, not by separate visual brands

### Consequences

PermissionGate and nav configuration drive differences; do not fork themes per role.

---

## DD-007 — Sparse Lucide iconography (animated)

| Field | Value |
| --- | --- |
| Status | Accepted |
| Date | 2026-08-05 |
| Updated | 2026-08-14 |

### Context

Icons are easy to overuse and fragment when teams pull from multiple libraries. NestFlow should stay text-forward and visually consistent with shadcn/ui. Hover motion is already an approved stack choice (Motion for React).

### Decision

- Do not add icons by default; prefer labelled controls
- When an icon is needed, use [lucide-animated](https://lucide-animated.com/) (Lucide shapes, Motion hover) from `src/components/icons/`
- Install icons with the shadcn registry `@lucide-animated/{name}`
- Icon-only controls must have tooltips and accessible names
- Do not use emoji as UI icons
- Hover animation must not run when `prefers-reduced-motion: reduce` is set

### Consequences

Coding rules and component docs treat lucide-animated as the icon source. Static `lucide-react` is only for a glyph that does not exist in the animated set. New unrelated icon packs still need a design decision update.

---

## DD-008 — Centered dark branded auth entry

| Field | Value |
| --- | --- |
| Status | Accepted |
| Date | 2026-08-05 |

### Context

NestFlow needs a distinctive login surface (DD-004). A centered dark auth reference was mapped onto NestFlow brand tokens after an earlier split-panel exploration.

### Decision

- Entry (`/` and `/login`) uses a centered dark auth screen (near-black stage, soft warm light)
- Atmosphere uses NestFlow `#FF6300` radial glow plus soft neutral light sweeps, not purple or stock SaaS gradients
- Primary CTA is high-contrast white on dark (reference pattern); brand orange remains on the mark and focus accents
- Form accepts Nest ID or work email + password only; no social / SSO / magic-link options in v1
- Invite-only copy replaces public sign-up

### Consequences

`AuthSplitShell` and `AuthLoginForm` are the shared auth UI. Product stack details live in `docs/`, not a public preview route.

---

## DD-009 — Dark workspace app shell

| Field | Value |
| --- | --- |
| Status | Accepted |
| Date | 2026-08-05 |

### Context

Authenticated NestFlow needs operational workspace chrome that matches the orange brand without copying CRM “leads/deals” metaphors.

### Decision

- App shell uses a pure black stage (`#000000`) with a slim icon rail, top workspace strip, and avatar/notifications
- Dashboard maps the reference layout to NestFlow: Workspace header, New Task, Open / In progress / Blocked stats, Focus cards, Today’s Tasks with NestFlow statuses
- Focus and recent-task cards use a stepped blob surface (`SteppedCard`): large radii, top-right notch for circular actions, primary / ink tones with dark outline buttons
- Live task data fills those cards (M2+); older static preview scaffolding is retired
- Shell follows document light/dark theme via CSS tokens (no forced local `.dark` lock)
- Header `WorkspaceIsland` is a theme-matched status strip: pomodoro, date, person, a live inbox ticker (unread first, then latest update), and a personal work pulse that opens My Tasks.

### Consequences

Board, My Tasks, and role pages inherit the shell. Live counts fill the trailing pulse. Pomodoro persists locally. Team presence stays off the island until it is real.

---

## Template for new decisions

```md
## DD-00X — Title

| Field | Value |
| --- | --- |
| Status | Proposed / Accepted / Superseded |
| Date | YYYY-MM-DD |

### Context
### Decision
### Consequences
```
