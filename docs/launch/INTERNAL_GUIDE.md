# NestFlow internal launch guide

How Nest by Eden employees sign in and get work done in NestFlow.

| Field | Value |
| --- | --- |
| Audience | Nest by Eden employees |
| Product URL | `https://tasks.nestbyeden.app` (after DNS cutover) |
| Soft launch | `1.0.0` |
| Last updated | 2026-08-14 |
| Platform | Supabase Free (shared NestByEden) + Vercel |

## Overview

NestFlow is the internal task tool for Nest by Eden. Use it to plan work, assign owners, track status, and leave comments. It is separate from the gear system.

Tagline: **Plan. Assign. Deliver.**

## Sign in

1. Open NestFlow.
2. Sign in with your **Nest ID** (for example `GFX2`) or work email.
3. Use your existing Nest by Eden password.
4. If sign-in fails, ask an Admin or HR to confirm your account is Active.

Accounts are invite-only. New joiners are invited from Overview or People tasks.

## First 10 minutes

1. Open **My Tasks**.
2. Create a task in the **General** workspace, or open one assigned to you.
3. Set status, priority, and due date.
4. Add a checklist item and a comment.
5. Open **Work** (or **Calendar** if you are HR) and move a card with drag-and-drop or **Move to**.
6. Press ⌘K to search tasks and people.
7. Check the bell for notifications. Open **Mentions** from the inbox filter when you need comments directed at you.

## Roles at a glance

| Role | Main home |
| --- | --- |
| Staff | My Tasks, then Work |
| Line Manager | Dashboard, then Team |
| HR | People tasks |
| Admin | Overview (Work and People) |

Managers, HR, and Admin can assign other people. Staff update their own assigned work.

## Statuses

Backlog → To Do → In Progress → Blocked → Review → Completed

Blocked tasks need a reason. NestFlow rejects illegal moves.

## Notifications

- In-app: bell and Notifications page (All, Unread, Mentions, Assignments)
- Email / push: when Resend and Web Push are configured; control preferences under Profile

## Attachments

Upload from task detail when Cloudflare R2 is configured. Max 25 MB. Common office and image types only.

## Tips

- Mention people in comments with `@NestID` (for example `@GFX2`) so they get notified.
- Put HR-sensitive work in the **People & HR** workspace (visible to HR and Admin).
- Update status in NestFlow instead of chat-only updates.
- Recurring rules, approvals, dependencies, time, and gear links live on task detail when you need them.

## Getting help

See [SUPPORT.md](SUPPORT.md) for channels and incident steps.

## See Also

- [Support](SUPPORT.md)
- [Domain cutover](DOMAIN_CUTOVER.md)
