# NestFlow components

Reusable UI building blocks, variants, and accessibility expectations.

| Field | Value |
| --- | --- |
| Status | Current |
| Last updated | 2026-09-04 |
| Foundation | shadcn/ui + Tailwind + NestFlow tokens |

## Overview

Prefer existing shadcn and NestFlow components before you invent a new primitive. Update this page when you add a shared domain component.

## 1. Principles

1. Own component source in-repo (shadcn/ui pattern).
2. Prefer composition over one-off page markup.
3. Every interactive component needs hover, focus, disabled, and loading states where applicable.
4. Motion is purposeful: entrance, feedback, hierarchy. Not decoration spam.
5. Don't use icons by default; prefer text labels. When an icon is needed, use lucide-animated from `src/components/icons/`.
6. Tooltips explain dense icon-only controls.
7. Components must support light and dark themes with primary `#FF6300`.
8. Accessibility is part of the component contract, not a later pass.

## 2. Token-backed primitives

Built from shadcn/ui and customised:

| Component | Notes |
| --- | --- |
| `Button` | Primary uses `#FF6300`; variants: default, secondary, ghost, destructive, outline |
| `Input` / `Textarea` | Form controls with validation styles |
| `Select` / `Combobox` | Assignees, tags, filters |
| `Checkbox` | Checklist items |
| `Dialog` / `Sheet` | Task create/edit, mobile detail |
| `DropdownMenu` | Row actions |
| `Tooltip` | Icon button explanations |
| `Popover` | Compact pickers |
| `Tabs` | Board / list / calendar switching |
| `Badge` | Status and priority chips |
| `Avatar` | User identity |
| `Card` | Use sparingly; prefer non-card layouts except interactive containers |
| `Table` | List view foundation (with TanStack Table) |
| `Toast` / `Sonner` | Mutation feedback; sounds via `@/lib/sounds/toast` |
| `Skeleton` | Loading placeholders |
| `Switch` | Theme and notification preferences |

## 3. NestFlow domain components

| Component | Responsibility | Key states |
| --- | --- | --- |
| `AppShell` | Top-bar chrome for Staff / LM / HR (brand, routes, island, tools) | mobile sheet nav |
| `DynamicIsland` | Spring morph shell for workspace status | idle / strip / timer / notification / action |
| `GooeyInput` | Aceternity gooey search control | collapsed / expanded |
| `GradientBars` / `GradientBarsBackground` | Animated NestFlow orange bar stage | reduced-motion off |
| `AuthLoginForm` | Nest ID or email + password | validating, error, submitting |
| `NestFlowMark` | Product mark tile (`brand` / `panel` tones) | size sm–lg |
| `ThemeToggle` | Light/dark | animated icon swap |
| `StatStrip` / `DashboardMetric` | Overdue, open, completed | loading, empty |
| `TaskBoard` | Kanban columns | dragging, drop target, empty column |
| `TaskColumn` | Single status column | overflow, count |
| `TaskCard` | Compact task summary | hover elevation/motion, blocked emphasis |
| `TaskList` | Table/list presentation | sorted, filtered, selectable |
| `TaskCalendar` | Due-date month/week | dense day cells, drag to reschedule |
| `TaskDetail` | Full task workspace | editing, saving |
| `StatusBadge` | Status colour mapping | all six statuses |
| `PriorityBadge` | Priority mapping | four priorities |
| `AssigneePicker` | Multi-select people | search, empty, chips |
| `CommandPalette` | Global search (⌘K) | tasks + people |
| `TaskPane` | Slide-over task detail | intercepting `/app/tasks/[id]` |
| `MyTasksPlan` | Today / Upcoming / Later grouping | overdue, completed collapsed, inline status / checklist / comment |
| `WorkViewSwitcher` | Board / List / Calendar on `/app/work` | active tab |
| `MentionField` | @NestID autocomplete while typing | empty query, keyboard |
| `DeactivateUserButton` | Lock account after reassigning open work | no open work, successor required |
| `NotificationInbox` | Actionable inbox | mentions, assignments, comment, complete |
| `ChecklistEditor` | Add/toggle/remove items | progress |
| `CommentThread` | Comments + mentions | pending, failed send |
| `ActivityFeed` | Historical events | grouped by day |
| `AttachmentList` | Upload/list/remove via R2 signed URLs | uploading, error |
| `NotificationBell` | Unread indicator | zero / n |
| `WorkspaceIsland` | Dynamic Island status (pomodoro, date, inbox, pulse) | idle, strip, timer, notification, action |
| `NotificationPanel` | In-app list | read/unread |
| `EmptyState` | No data guidance | with CTA |
| `PermissionGate` | Conditional render by capability | hidden vs disabled policy |

Sound plumbing lives under `src/lib/sounds/` and `src/components/sounds/`. Client toasts import from `@/lib/sounds/toast`, not `sonner` directly.

## 4. Status visual language

| Status | Intent |
| --- | --- |
| Backlog | Neutral / muted |
| To Do | Neutral emphasis |
| In Progress | Active (primary-tint allowed) |
| Blocked | Warning / danger-adjacent |
| Review | Informational |
| Completed | Success |

Don't rely on colour alone; include text labels.

## 5. Motion guidelines

Use Motion for React selectively:

| Pattern | Where |
| --- | --- |
| Subtle fade/slide | Page section enter |
| Layout animation | Board card reorder |
| Micro-scale / colour | Button press, toggle |
| Progress animation | Checklist completion |

Avoid continuous looping animations in productivity surfaces.

## 6. Sound feedback

Use `react-sounds` through NestFlow helpers. Do not call the library ad hoc from feature UIs.

| Helper | Use |
| --- | --- |
| `@/lib/sounds/toast` | Default for mutation toasts (`success`, `error`, `reject`, `taskUpdate`) |
| `playAppSound` / `triggerHaptic` | Island, delete confirm, and other non-toast moments |
| `AppSoundProvider` | Authenticated app shell; preloads the feedback catalog |

Categories: click, confirm, delete, reject, error, timer, timerComplete, island, taskNotification, taskUpdate, toggleOn, toggleOff. Keep clicks sparse. Pass `{ sound: false }` on a toast when a local control already played the sound. Mute from the account menu (**Sound effects**); preference is stored by `SoundProvider`.

## 7. Tooltip and hover rules

- Icon-only controls require tooltips.
- Hover styles must have equivalent focus-visible styles.
- Drag handles need keyboard alternatives documented in UI (menu: Move to status).

## 8. Responsiveness

| Breakpoint intent | Behaviour |
| --- | --- |
| Mobile | Bottom or collapsible nav; task detail as sheet; board may horizontal-scroll columns |
| Tablet | Compact shell; usable board |
| Desktop | Full board + side detail optional |

## 9. Accessibility checklist (per component)

- [ ] Semantic element or correct ARIA role
- [ ] Labelled controls
- [ ] Visible focus ring
- [ ] Keyboard operability
- [ ] Contrast against light and dark backgrounds
- [ ] Reduced-motion respect where animation is non-essential

## 10. File organisation

```text
src/components/
  ui/              # shadcn primitives
  layout/          # app shell, nav
  sounds/          # AppSoundProvider
  tasks/           # board, list, calendar, detail, pane, bulk bar
  admin/           # Overview, Team, People suites
  workspace/       # dashboards, island
  notifications/   # bell, inbox, preferences
  search/          # command palette
  icons/           # lucide-animated
  auth/            # sign-in
```

## 11. Contribution rule

Before you add a one-off control to a page, check whether an existing NestFlow component can be extended. Update this document when you introduce a new shared domain component.

## 12. Admin UI (`src/components/admin/ui/`)

| Component | Contract |
| --- | --- |
| `AdminPageShell` | Two-column layout: optional `sidebar` slot + `children` main panel. Responsive stack on small screens. |
| `AdminMetricBlock` | `{ label, value, tone?, active?, onClick? }` — semantic colour block for sidebar metrics. |
| `AdminSectionTabs` | `{ tabs: { id, label }[], value, onChange }` — pill segment control for Tasks/Activity/Delivery/People. |
| `AdminTaskCard` | Simplified task row: title, status badge, assignees, due, activity summary. Uses `taskRowSurfaceClass`. |
| `AdminActivityItem` | Timeline row for log feed: actor, summary, timestamp. |
| `AdminDrawerWizard` | `{ steps, currentStep, title, children, footer }` — shared step header/footer for deactivate and assign flows. |
| `AdminWeekCalendar` | Week grid (Mon–Sun, all-day + hourly rows) for admin Tasks tab. |
| `AdminWeekTaskBlock` | Calendar task card: title, description, assignee, due time, completed stripe. |

Shared helpers live in `src/components/admin/admin-shared.ts`. Overview composition: `admin-overview.tsx` + `admin-*-panel.tsx`.

## See Also

- [Design](../design/DESIGN.md)
- [Design decisions](../design/DESIGN_DECISIONS.md)
- [Coding rules](CODING_RULES.md)
