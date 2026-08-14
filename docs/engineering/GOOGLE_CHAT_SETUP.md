# NestFlow Google Chat setup

Post NestFlow assignment, mention, due-soon, and overdue cards into a Google Chat space (ADR-005).

v1 uses an incoming webhook. Personal DMs need a later org-installed Chat app.

## Overview

NestFlow stays the system of record. Chat is an attention channel. Cards include an **Open in NestFlow** button. Staff still sign in to NestFlow as today.

The app compiles and runs without Chat env vars. Sends skip until the webhook is configured.

## How to (space webhook)

Do this in a browser at [Google Chat](https://chat.google.com). Incoming webhooks are not configured on the Chat mobile app.

1. Create or open a space (for example **NestFlow alerts**).
2. Add the people who should see alerts.
3. Click the space name, then **Apps & integrations**.
4. Click **Add webhooks**.
5. Name it `NestFlow`. Click **Save**.
6. Click **More** → **Copy link**.
7. Paste the URL into `.env.local` and Vercel as `GOOGLE_CHAT_WEBHOOK_URL`. Set `GOOGLE_CHAT_ENABLED=true`.
8. Restart the NestFlow server so it reads the new env.

The URL looks like `https://chat.googleapis.com/v1/spaces/.../messages?key=...&token=...`. Treat it as a password. Anyone with it can post to the space.

### If Add webhooks is missing

Workspace policy has incoming webhooks off, or you are not a manager of the space. Stay on email, in-app, and web push until an Admin can install a Chat app.

## Environment variables

Never use `NEXT_PUBLIC_*` for Chat secrets.

| Variable | Required | Purpose |
| --- | --- | --- |
| `GOOGLE_CHAT_ENABLED` | Yes, for sends | Set to `true` to turn the channel on |
| `GOOGLE_CHAT_WEBHOOK_URL` | Yes, for v1 | Incoming webhook URL from the space |
| `NEXT_PUBLIC_APP_URL` | Already required | Absolute **Open in NestFlow** links |

Optional later (personal DMs; not used in v1):

| Variable | Purpose |
| --- | --- |
| `GOOGLE_CHAT_CLIENT_EMAIL` | Chat app service account email |
| `GOOGLE_CHAT_PRIVATE_KEY` | Service account private key |

### Local

```bash
GOOGLE_CHAT_ENABLED=true
GOOGLE_CHAT_WEBHOOK_URL=https://chat.googleapis.com/v1/spaces/SPACE_ID/messages?key=KEY&token=TOKEN
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Vercel

Set the same keys in Project Settings → Environment Variables. Don't commit `.env.local`.

## What staff see

| Event | Card |
| --- | --- |
| Assigned a task | Title, short body, Open button |
| @mentioned | Same |
| Due soon / overdue | Same, reminder subtitle |

Webhook cards post into the **space**, not a private DM. Space members can see them.

Users can disable Chat event types under Profile. In-app history stays.

## Health

`GET /api/health` includes `googleChat`: `configured` or `missing`. It never returns the webhook URL.

## Failure behaviour

| Situation | Behaviour |
| --- | --- |
| Chat env missing | NestFlow works; Chat skipped |
| Invalid URL or Google error | Log; task still saves |
| User turned Chat off | No Chat for that event |
| Webhooks disabled by IT | Channel stays missing until a Chat app is installed |

## Later: personal DMs

That path needs Workspace Admin: company Google Cloud project, Chat API, service account, internal Chat app named NestFlow, org install. Then replace the webhook with `GOOGLE_CHAT_CLIENT_EMAIL` and `GOOGLE_CHAT_PRIVATE_KEY`. See ADR-005.

## See Also

- [ADR-005](../decisions/ADR-005-google-chat-notifications.md)
- [Architecture](ARCHITECTURE.md)
- [R2 setup](R2_SETUP.md)
