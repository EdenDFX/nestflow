# NestFlow product requirements

What NestFlow is for, who uses it, and what v1 must do.

| Field | Value |
| --- | --- |
| Product | NestFlow |
| Status | Soft launch `1.0.0` shipped; M7.1 remaining T-071–T-073; M8 shipped except T-087 |
| Version | 0.1.2 |
| Last updated | 2026-08-14 |
| Planned URL | `tasks.nestbyeden.app` |
| Related gear system | Nest by Eden gear management (`nestbyeden`) |

## 1. Purpose

NestFlow is an internal task-management system that helps Nest by Eden plan work, assign ownership, track progress, and deliver outcomes across teams.

It is separate from the gear management system. NestFlow may later link tasks to required gear, but gear inventory remains owned by the gear platform.

**Tagline:** Plan. Assign. Deliver.

## 2. Problem statement

Teams currently lack a dedicated, role-aware workspace for operational tasks. Work is scattered across informal channels, which makes ownership unclear, due dates easy to miss, and progress hard to audit.

NestFlow solves this by providing:

- Clear ownership and assignment
- Shared boards and lists with consistent statuses
- Role-based visibility for Admin, Line Manager, HR, and Staff
- Email and push notifications for important events
- An audit trail suitable for internal operations

## 3. Goals

### 3.1 Primary goals (v1)

1. Give every employee a personal task inbox and shared team boards.
2. Support invite-only access with unique Nest ID login identifiers.
3. Enforce role-based permissions for create, assign, edit, complete, and administer.
4. Deliver reliable email and web push notifications.
5. Provide light and dark UI with NestFlow primary colour `#FF6300`.
6. Ship as a responsive web application suitable for desktop and mobile browsers.

### 3.2 Non-goals (v1)

- Public self-signup
- Customer-facing project portals
- Full HRIS or payroll replacement
- Native iOS / Android apps (responsive web first)
- Deep gear inventory management (link later, do not rebuild)

## 4. Users and roles

| Role | Primary need |
| --- | --- |
| Administrator | Configure organisation, departments, roles, permissions, integrations, and audit |
| Line Manager | Create and assign team work, monitor progress, unblock staff |
| HR | Oversee people-related workflows, onboarding tasks, compliance checklists, and employee status |
| Staff | View assigned work, update progress, comment, complete checklists |

### 4.1 Permission principles

- Least privilege by default
- Role grants capability; team membership grants scope
- Deactivated employees retain historical attribution but cannot sign in
- Sensitive HR workflows are restricted to HR and Admin unless explicitly shared
- Server-side and database (RLS) checks are both required

## 5. Product surfaces

### 5.1 Shared surfaces

| Screen | Description |
| --- | --- |
| Login | Unique Nest ID / work email + password; branded NestFlow experience |
| Dashboard | Overdue, outstanding, completed, and upcoming work |
| My Tasks | Personal day plan with inline status, checklist, and comment |
| Work | Board, list, and calendar in one surface (`/app/work`) |
| Task detail | Description, checklist, attachments, comments, activity; slide-over pane |
| Notifications centre | In-app history with All, Unread, Mentions, Assignments |
| Profile / preferences | Theme, notification preferences, security basics |
| Search | Command palette (⌘K) across accessible tasks and people |

### 5.2 Administrator

| Screen | Description |
| --- | --- |
| Org settings | Company defaults, branding tokens if needed (T-071, not shipped) |
| User management | Invite, activate, deactivate, assign roles |
| Departments / teams | Structure organisation units |
| Permission matrix | Review role capabilities |
| Audit log | Security and admin event history |
| Notification templates | Email/push template overview (T-072, not shipped) |
| System health | Basic delivery and integration status (T-073, not shipped) |

### 5.3 Line Manager

| Screen | Description |
| --- | --- |
| Team board | Tasks for managed teams |
| Assign / reassign | Bulk and single assignment tools |
| Workload view | Distribution of open work across team members |
| Blocked queue | Tasks waiting on dependencies or blockers |

### 5.4 HR

| Screen | Description |
| --- | --- |
| People tasks | Onboarding, offboarding, compliance task sets |
| Employee status | Coordinate with deactivation / reactivation flows |
| Template libraries | Repeatable HR task templates (shipped in M8) |

### 5.5 Staff

| Screen | Description |
| --- | --- |
| My Tasks | Primary daily workspace |
| Mentions | Inbox filter for comments directed at the user |
| Quick update | Status, checklist, and comment actions on My Tasks |

## 6. Core features (v1)

### 6.1 Identity and access

- Invite-only employee accounts
- Unique Nest ID (employee identifier) visible in UI
- Authentication via existing Supabase Auth identity where possible
- Roles: Administrator, Line Manager, HR, Staff
- Session security, password sign-in first; MFA / passkeys later
- Custom branded login experience per NestFlow visual system

### 6.2 Work organisation

- Departments and project workspaces
- Task creation and assignment
- Statuses: Backlog, To Do, In Progress, Blocked, Review, Completed
- Priority, due date, description, checklist, attachments, tags
- Comments, mentions, activity history
- Views: My Tasks, Work (board / list / calendar)
- Dashboard metrics for overdue, completed, and outstanding tasks

### 6.3 Notifications

| Channel | Events (initial) |
| --- | --- |
| Email | Assignment, mention, due soon, overdue, invite |
| In-app | Same events plus status changes on watched tasks |
| Web push | Assignment, mention, overdue (user-permissioned) |
| Google Chat | Assignment, mention, due soon, overdue (optional; space webhook in v1, ADR-005) |

Users can configure channel preferences where operationally allowed. Chat cards link into NestFlow. Chat is not a second task store.

### 6.4 Interaction and UX quality

- Dynamic components with purposeful motion
- Tooltips and hover affordances for dense controls
- Light and dark mode
- Responsive layouts for mobile and desktop
- Keyboard-accessible alternatives for drag-and-drop

### 6.5 Security and operations

- Row Level Security on exposed tables
- Audit log for administrative and sensitive actions
- Rate limiting on auth and mutation endpoints
- Private attachment storage on Cloudflare R2 (signed URLs; metadata in Postgres)
- Backups via platform capabilities
- Employee deactivation without deleting task history

## 7. Key workflows

### 7.1 Invite and first login

1. Admin or HR invites employee with Nest ID and work email.
2. Employee receives invite email.
3. Employee sets password and signs in.
4. System assigns default Staff role unless overridden.
5. Employee lands on Dashboard / My Tasks.

### 7.2 Create and assign a task

1. Manager (or authorised role) creates a task in a workspace.
2. Sets priority, due date, assignees, tags.
3. Assignees receive email, in-app, optional push, and optional Google Chat notification.
4. Task appears in My Tasks and team board.

### 7.3 Progress a task

1. Assignee moves status or updates checklist.
2. Comments and mentions notify relevant people.
3. Blocked status requires a reason.
4. Review status signals readiness for manager confirmation.
5. Completed status closes the task and updates dashboards.

### 7.4 Deactivate an employee

1. Admin or HR starts deactivation.
2. If the account has open work, choose successor assignees.
3. NestFlow reassigns those tasks, then locks the account.
4. Historical comments and authorship stay attributed.
5. Sign-in is blocked immediately.

## 8. Success metrics

| Metric | Target (initial) |
| --- | --- |
| Invite-to-first-login conversion | >= 90% within 7 days |
| Tasks created with an assignee | >= 95% |
| Overdue tasks with no comment in 7 days | Decreasing month over month |
| Notification delivery success | >= 99% for email provider accepted sends |
| Critical permission defects in production | Zero tolerance |

## 9. Acceptance criteria (v1)

- [x] Users can sign in with Nest ID or work email and password.
- [x] Each role can access only permitted screens and data.
- [x] Tasks support all v1 fields, statuses, comments, checklists, and attachments.
- [x] Board, list, calendar, and My Tasks views work on desktop and mobile.
- [x] Light and dark themes render with primary `#FF6300`.
- [x] Email and push notifications fire for the agreed event set (when Resend / VAPID are configured).
- [x] Google Chat cards fire for assignment, mention, due soon, and overdue when a space webhook is configured (ADR-005).
- [x] Deactivated users cannot authenticate; history is preserved.
- [x] Audit log captures admin user-management events.
- [x] Accessibility baseline: keyboard navigation for core flows, labelled controls, visible focus.

Production DNS, Vercel env, and invite-only provisioning (T-011) remain ops / follow-up.

## 10. Later versions

Tracked in [ROADMAP.md](ROADMAP.md) as **M8+** and [TASKS.md](TASKS.md) as T-080–T-088.

| Enhancement | Task | Status |
| --- | --- | --- |
| Recurring tasks | T-080 | Shipped |
| Approvals | T-081 | Shipped |
| Task dependencies graph | T-082 | Shipped |
| Time tracking | T-083 | Shipped |
| Performance / delivery reports | T-084 | Shipped |
| Gear-system deep links | T-085 | Shipped |
| Advanced automation + templates | T-086 | Shipped |
| Passkeys / MFA | T-087 | Open |
| Google Chat notifications | T-088 | Shipped (space webhook; personal DMs later) |

PRD §5 still open under M7.1: Admin org settings (T-071), notification templates gallery (T-072), Admin system health UI (T-073). Search, Mentions, quick update, Admin People, and manager assign are shipped.

## 11. Open questions

1. Exact full gear-system production URL and hosting provider.
2. Approximate employee count and department list for capacity planning.
3. Formal Nest ID assignment process (currently backfilled from email local-part).

Resolved: NestFlow reuses the shared NestByEden Supabase project (ADR-001). HR workspaces (`kind=hr`) are hidden from Line Managers. Staff can create and update their own or assigned tasks. Parent domain is `nestbyeden.app`.

## 12. Document history

| Version | Date | Notes |
| --- | --- | --- |
| 0.1.0 | 2026-08-05 | Initial PRD from planning sessions |
| 0.1.1 | 2026-08-06 | Status after 1.0.0 soft launch; M7.1 merge plan + M8 task IDs |
| 0.1.2 | 2026-08-14 | Work surface, shipped M7.1/M8, remaining T-071–T-073 and T-087 |

## See Also

- [Roadmap](ROADMAP.md)
- [Tasks](TASKS.md)
- [Role matrix](../engineering/ROLE_MATRIX.md)
