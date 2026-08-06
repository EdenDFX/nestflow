# NestFlow Project Glossary

Agreed meanings for product and engineering terms. Prefer these words in UI copy and docs.

| Term | Meaning |
| --- | --- |
| NestFlow | The internal task-management product |
| Nest by Eden | Organisation / brand operating NestFlow and the gear system |
| Gear system | Separate platform for tracking company gear; not owned by NestFlow |
| Nest ID | Unique human-facing employee identifier; not a password |
| User ID | Internal UUID (`auth.users.id`) |
| Administrator / Admin | Role with organisation-wide configuration and audit capabilities |
| Line Manager | Role that manages work within assigned teams |
| HR | Role focused on people workflows, invites/deactivation policy, HR queues |
| Staff | Standard employee role working assigned tasks |
| Team / Department | Organisational unit used for membership and scope |
| Workspace | Project space where tasks live; team-scoped |
| Task | Unit of work with status, priority, assignees, and activity |
| Backlog | Task status for work not yet scheduled; not the product name |
| Assignee | User responsible for progressing a task |
| Watcher | User following a task without being the assignee (future if needed) |
| Blocked | Status indicating progress cannot continue; requires reason |
| Review | Status indicating work is ready for checking |
| Activity | Historical record of meaningful task changes |
| Notification | In-app, email, or push alert about an event |
| Invite-only | Access model where users must be provisioned before first login |
| Deactivation | Blocking sign-in while preserving historical attribution |
| RLS | Postgres Row Level Security policies |
| ADR | Architecture Decision Record |
| DD | Design Decision entry in `DESIGN_DECISIONS.md` |
| R2 | Cloudflare R2 private object storage for NestFlow attachments |

## Naming reminders

- Say “add it to the NestFlow backlog” when speaking casually.
- Do not brand the product as Backlog.
- Prefer “Line Manager” in product copy unless a shorter label is required in dense UI.
