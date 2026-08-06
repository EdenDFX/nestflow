# NestFlow Product Requirements Document (PRD)

| Field | Value |
| --- | --- |
| Product | NestFlow |
| Status | Soft launch 1.0.0 shipped; PRD surface close-out (M7.1) open |
| Version | 0.1.1 |
| Last updated | 2026-08-06 |
| Planned URL | `tasks.nestbyeden.com` |
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
| My Tasks | Personal assignment list with filters |
| Board | Kanban board by status |
| List | Dense table / list view |
| Calendar | Due-date calendar |
| Task detail | Description, checklist, attachments, comments, activity |
| Notifications centre | In-app notification history |
| Profile / preferences | Theme, notification preferences, security basics |
| Search | Global search across accessible tasks and people |

### 5.2 Administrator

| Screen | Description |
| --- | --- |
| Org settings | Company defaults, branding tokens if needed |
| User management | Invite, activate, deactivate, assign roles |
| Departments / teams | Structure organisation units |
| Permission matrix | Review role capabilities |
| Audit log | Security and admin event history |
| Notification templates | Email/push template overview |
| System health | Basic delivery and integration status |

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
| Template libraries | Repeatable HR task templates (v1.1 if needed) |

### 5.5 Staff

| Screen | Description |
| --- | --- |
| My Tasks | Primary daily workspace |
| Mentions | Comments and assignments directed at the user |
| Quick update | Status, checklist, and comment actions |

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
- Views: My Tasks, team board, list, calendar
- Dashboard metrics for overdue, completed, and outstanding tasks

### 6.3 Notifications

| Channel | Events (initial) |
| --- | --- |
| Email | Assignment, mention, due soon, overdue, invite |
| In-app | Same events plus status changes on watched tasks |
| Web push | Assignment, mention, overdue (user-permissioned) |

Users can configure channel preferences where operationally allowed.

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
3. Assignees receive email, in-app, and optional push notification.
4. Task appears in My Tasks and team board.

### 7.3 Progress a task

1. Assignee moves status or updates checklist.
2. Comments and mentions notify relevant people.
3. Blocked status requires a reason.
4. Review status signals readiness for manager confirmation.
5. Completed status closes the task and updates dashboards.

### 7.4 Deactivate an employee

1. Admin or HR deactivates the account.
2. Open tasks remain visible to managers for reassignment.
3. Historical comments and authorship remain attributed.
4. Sign-in is blocked immediately.

## 8. Success metrics

| Metric | Target (initial) |
| --- | --- |
| Invite-to-first-login conversion | >= 90% within 7 days |
| Tasks created with an assignee | >= 95% |
| Overdue tasks with no comment in 7 days | Decreasing month over month |
| Notification delivery success | >= 99% for email provider accepted sends |
| Critical permission defects in production | Zero tolerance |

## 9. Acceptance criteria (v1)

- [ ] Users can sign in with Nest ID or work email and password.
- [ ] Each role can access only permitted screens and data.
- [ ] Tasks support all v1 fields, statuses, comments, checklists, and attachments.
- [ ] Board, list, calendar, and My Tasks views work on desktop and mobile.
- [ ] Light and dark themes render with primary `#FF6300`.
- [ ] Email and push notifications fire for the agreed event set.
- [ ] Deactivated users cannot authenticate; history is preserved.
- [ ] Audit log captures admin user-management events.
- [ ] Accessibility baseline: keyboard navigation for core flows, labelled controls, visible focus.

## 10. Out of scope for later versions

Tracked in [ROADMAP.md](ROADMAP.md) as **M8+** and [TASKS.md](TASKS.md) as T-080–T-087:

| Enhancement | Task | Notes |
| --- | --- | --- |
| Recurring tasks | T-080 | Schedule-generated instances |
| Approvals | T-081 | Approve / reject workflow |
| Task dependencies graph | T-082 | Blocked-by rules |
| Time tracking | T-083 | Optional logs and totals |
| Performance / delivery reports | T-084 | Extend Admin + team performance surfaces |
| Gear-system deep links | T-085 | External references only |
| Advanced automation + templates | T-086 | Includes HR template libraries (v1.1) |
| Passkeys / MFA | T-087 | Optional stronger auth |

PRD §5 surfaces still closing under M7.1 (merge, do not replace): Admin org/settings/health, manager bulk reassign, Staff Mentions / quick update, global search. See TASKS T-070–T-079.

## 11. Open questions

1. Exact full gear-system production URL and hosting provider.
2. Whether NestFlow must reuse the existing Supabase project only, or may use a dedicated project if isolation requires it.
3. Approximate employee count and department list for capacity planning.
4. Whether HR requires private task spaces invisible to Line Managers by default.
5. Final confirmation of parent domain TLD (`nestbyeden.com` assumed).

## 12. Document history

| Version | Date | Notes |
| --- | --- | --- |
| 0.1.0 | 2026-08-05 | Initial PRD from planning sessions |
| 0.1.1 | 2026-08-06 | Status after 1.0.0 soft launch; M7.1 merge plan + M8 task IDs |
