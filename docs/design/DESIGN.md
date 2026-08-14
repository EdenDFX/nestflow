# NestFlow design system

Colour, type, motion, layout, and accessibility for NestFlow UI.

| Field | Value |
| --- | --- |
| Status | Current |
| Last updated | 2026-08-14 |
| Product | NestFlow |
| Primary | `#FF6300` |
| Modes | Light and dark |

## Overview

NestFlow should feel operational, clear, and energetic without becoming noisy. Use brand orange for primary action. Keep status colours distinct from the brand.

## 1. Design intent

NestFlow should feel operational, clear, and energetic without becoming noisy. The interface is a productivity workspace inspired by modern task boards: dense where needed, calm in chrome, with the brand orange used for primary action and active emphasis.

Reference direction: board-first task UI with crisp cards, clear status columns, and strong light/dark parity.

## 2. Brand

| Token | Value |
| --- | --- |
| Product name | NestFlow |
| Tagline | Plan. Assign. Deliver. |
| Primary | `#FF6300` |
| Primary foreground | `#FFFFFF` |

Brand appears in:

- Login hero/mark
- Primary buttons
- Active nav / focus accents
- Key progress indicators

Don't flood the board with orange. Status colours remain distinct from brand primary.

## 3. Colour system

Use CSS variables for theme switching.

### 3.1 Semantic roles

| Role | Light intent | Dark intent |
| --- | --- | --- |
| Background | Clean neutral surface | Deep neutral surface |
| Foreground | Near-black text | Near-white text |
| Muted | Secondary labels | Secondary labels |
| Border | Subtle separators | Subtle separators |
| Primary | `#FF6300` | `#FF6300` (adjust contrast if needed) |
| Destructive | Clear error red | Clear error red |
| Success | Completed / healthy | Completed / healthy |
| Warning | Blocked / risk | Blocked / risk |

Exact companion neutrals chosen at scaffold (2026-08-05):

| Token | Light | Dark |
| --- | --- | --- |
| Background | Warm near-white `oklch(0.975 0.008 75)` | Warm near-black `oklch(0.17 0.012 55)` |
| Foreground | Warm ink `oklch(0.26 0.02 55)` | Warm near-white `oklch(0.93 0.01 75)` |
| Primary | `#FF6300` | `#FF6300` |
| Primary foreground | `#FFFFFF` | `#FFFFFF` |
| Ring / sidebar primary | `#FF6300` | `#FF6300` |
| Success / warning / info | Semantic tokens in `src/app/globals.css` | Same roles, dark-tuned |

### Typography (scaffold)

| Role | Font |
| --- | --- |
| Display / brand | Outfit (`--font-outfit` / `font-heading`) |
| UI / body | Geist Sans |
| Mono | Geist Mono |

### 3.2 Status colours

| Status | Guidance |
| --- | --- |
| Backlog | Muted neutral |
| To Do | Neutral emphasis |
| In Progress | Primary-tint or information blue-orange balance |
| Blocked | Warning |
| Review | Informational |
| Completed | Success |

Always pair colour with a text label.

## 4. Typography

Choose expressive but readable UI fonts. Avoid default generic stacks (Inter/Roboto/Arial/system-only) for brand surfaces; productivity body text may use a highly legible sans already approved for the product.

| Role | Guidance |
| --- | --- |
| Display / brand | Distinctive sans for login and empty-hero moments |
| UI / body | High-legibility sans for dense boards and forms |
| Mono | Optional for IDs (Nest ID) |

Type scale should support:

- Page titles
- Section titles
- Card titles
- Body
- Labels / captions

## 5. Spacing and radius

| Token | Guidance |
| --- | --- |
| Spacing scale | Tailwind default scale; prefer 2/3/4/6/8 rhythm |
| Card radius | Soft, moderate radius consistent with shadcn defaults unless design overrides |
| Board gaps | Comfortable column and card spacing; avoid cramped stacks |

## 6. Elevation and surfaces

- Prefer subtle borders over heavy multi-layer shadows.
- Hover may slightly lift interactive task cards.
- Avoid glassmorphism and glow-heavy chrome.

## 7. Layout

### 7.1 App shell

- Top or side navigation with NestFlow mark
- Content canvas for Dashboard, My Tasks, Work (board / list / calendar)
- Command palette (⌘K), notification bell, and user menu in chrome

### 7.2 Board

- Columns by status
- Task cards with title, priority, assignees, due date
- Drag-and-drop with keyboard alternative

### 7.3 Task detail

- Title and metadata header
- Description
- Checklist
- Attachments
- Comments / activity

### 7.4 Login

- Centered dark NestFlow entry (DD-008)
- Nest ID or email + password fields (placeholder-led)
- High-contrast white primary CTA on dark stage
- Brand orange reserved for mark, glow, and focus
- No social SSO buttons; invite-only copy
- Clear error states
- Auth stage is intentionally dark; app shell remains light/dark capable

## 8. Motion

Ship intentional motion, typically 2–3 signature patterns:

1. Board card layout transitions
2. Theme toggle morph / fade
3. Feedback on create/complete actions

Respect `prefers-reduced-motion`.

## 9. Tooltips and hover

- Tooltip every icon-only control.
- Hover and focus-visible states required for interactive elements.
- Disabled states must not rely on colour alone.

## 10. Responsiveness

| Viewport | Priority |
| --- | --- |
| Desktop | Full board + detail workflows |
| Tablet | Usable board; compact nav |
| Mobile | My Tasks first; board as horizontal columns or stacked alternative; detail in sheet |

## 11. Content style

- Short labels; verbs on buttons (“Assign”, “Mark complete”)
- No em dash stylistic pauses in UI copy (see project dash-usage rule)
- Empty states explain the next action

## 12. Accessibility

- Contrast AA target for text and essential controls
- Visible focus rings
- Keyboard access for core flows
- Don't convey meaning by colour alone

## 13. Iconography

- Don't use icons by default. Prefer text labels for actions and navigation unless density or established patterns clearly need a mark.
- When an icon is justified, use [lucide-animated](https://lucide-animated.com/) (Lucide + Motion hover) from `src/components/icons/`. Don't mix unrelated icon sets or ad-hoc SVGs for UI chrome.
- Icon-only controls require a visible text alternative via tooltip (and accessible name).
- No emoji as primary UI iconography.

## 14. Asset guidance

- Prefer SVG for brand marks and non-icon graphics
- Attachment previews must fail safely

## See Also

- [Design decisions](DESIGN_DECISIONS.md)
- [Components](../engineering/COMPONENTS.md)
- [Documentation style](../engineering/DOCS_STYLE.md)
