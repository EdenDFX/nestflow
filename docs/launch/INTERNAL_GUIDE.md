# NestFlow internal launch guide

| Field | Value |
| --- | --- |
| Audience | Nest by Eden employees |
| Product URL | `https://tasks.nestbyeden.app` (after DNS cutover) |
| Soft launch | M7 |
| Platform | Supabase Free (shared NestByEden) + Vercel |

## What NestFlow is

NestFlow is the internal task tool for Nest by Eden. Use it to plan work, assign owners, track status, and leave comments. It is separate from the gear system.

Tagline: **Plan. Assign. Deliver.**

## How to sign in

1. Open NestFlow.
2. Sign in with your **Nest ID** (for example `GFX2`) or work email.
3. Use your existing Nest by Eden password.
4. If sign-in fails, ask an Admin or HR to confirm your account is Active.

Accounts are invite-only. New joiners are invited from Admin or People tasks.

## First 10 minutes

1. Open **My Tasks**.
2. Create a task in the **General** workspace (or open one assigned to you).
3. Set status, priority, and due date.
4. Add a checklist item and a comment.
5. Open **Board** and move a card with drag-and-drop or **Move to**.
6. Check the bell for notifications.

## Roles at a glance

| Role | Main home |
| --- | --- |
| Staff | Dashboard / My Tasks |
| Line Manager | Team (board, workload, blocked) |
| HR | People tasks (HR queues, employee status) |
| Admin | Admin (users, departments, invites, audit) |

Managers and admins can assign other people. Staff update their own assigned work.

## Statuses

Backlog → To Do → In Progress → Blocked → Review → Completed

Blocked tasks need a reason. Some moves are not allowed; NestFlow will say if a transition is illegal.

## Notifications

- In-app: bell and Notifications page
- Email / push: when Resend and Web Push are configured; control preferences under Profile

## Attachments

Upload from task detail when Cloudflare R2 is configured. Max 25 MB; common office and image types only.

## Tips

- Use Nest ID mentions in comments (`@GFX2`) so people get notified.
- HR-sensitive work belongs in the **People & HR** workspace (visible to HR and Admin).
- Prefer updating status in NestFlow instead of chat-only updates.

## Getting help

See [SUPPORT.md](SUPPORT.md) for channels and incident steps.
