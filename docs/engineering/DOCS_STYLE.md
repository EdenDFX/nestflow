# NestFlow documentation style

Write NestFlow docs the way Apple writes developer and instructional material: clear, current, and organised so a reader can act.

This guide adapts the [Apple Style Guide](https://support.apple.com/guide/applestyleguide/welcome/web) and [DocC documentation structure](https://developer.apple.com/documentation/Xcode/adding-structure-to-your-documentation-pages) for the NestFlow team. Product names, roles, and stack stay as defined in the PRD and ADRs.

| Field | Value |
| --- | --- |
| Status | Accepted |
| Last updated | 2026-08-14 |
| Audience | Engineers, operators, and AI agents writing NestFlow docs |
| Sources | Apple Style Guide (June 2026), DocC authoring, Chicago Manual of Style, NestFlow dash-usage rule |

## Overview

Every page answers three questions, in this order:

1. What is this?
2. How do I do the job?
3. Where is the reference?

Lead with a one-sentence abstract (about 150 characters or fewer). Put essentials before edge cases. Link related pages instead of copying them.

## Voice

Use second person (*you*) and present tense. Prefer active voice.

| Do | Don't |
| --- | --- |
| Sign in with your Nest ID. | Users will need to log in using their Nest ID. |
| Create a task in the General workspace. | A task can be created in the General workspace. |
| See [API](API.md). | Please see the API document for more information. |

- Use contractions where they sound natural (*don't*, *can't*, *it's*).
- Don't use *please*, *simply*, *just*, or *easy* in instructions.
- Don't use *we* in procedures. Name the actor (*Admin*, *you*, *NestFlow*) when you need one.
- Don't use *e.g.*, *i.e.*, or *etc.* Write *for example*, *that is*, and *and so on*.
- Use the serial comma.
- Use present tense for sequences that happen now. Don't switch to future tense when present tense is enough.

## Spelling and product language

- Keep NestFlow British spelling already in the product: *colour*, *organisation*. Don't switch to US *color* in these docs.
- Verb: *sign in* / *sign out*. Noun or adjective: *sign-in*.
- *Set up* is a verb. *Setup* is a noun or adjective.
- *Email*, *website*, and *workspace* are one word.
- Product name is **NestFlow**. *Backlog* is a task status, not the product name.
- Role names: Administrator (Admin in dense UI), Line Manager, HR, Staff.
- Match on-screen labels exactly, including capitalisation: **My Tasks**, **Work**, **Overview**.

Follow the project dash-usage rule. Don't use an em dash or en dash as a pause. Use a comma, colon, semicolon, period, or parentheses.

## Page structure

Use this shape on every substantial page:

1. **Title** (sentence case except product and proper names)
2. **Abstract** (one sentence under the title, or in the metadata table)
3. **Overview** (what it is and when to use it)
4. **How to** (numbered steps, imperative mood)
5. **Reference** (tables, contracts, diagrams)
6. **See Also** (related pages)

DocC-style topic groups on landing pages:

- Essentials
- Get started
- Guides
- Reference
- Decisions
- Launch

Keep a group to about ten links. Use unique, mutually exclusive group names.

## How-to steps

1. Start each step with an imperative verb.
2. Put one action in each step.
3. Show the result when it isn't obvious.
4. Use numbered lists for sequences. Use bullets for unordered facts.
5. Refer to UI with bold: Click **New Task**.
6. Use code voice for paths, env vars, types, and commands: `pnpm test`, `CRON_SECRET`.

Asides:

> **Note:** Extra context that doesn't stop the reader.

> **Important:** Something that prevents a failed setup or a security mistake.

> **Warning:** Data loss, outage, or secret exposure.

## Code and symbols

- Put file paths, symbols, SQL names, and commands in backticks.
- Indent code examples with spaces, not tabs.
- Keep examples copyable. Don't use placeholders that look like real secrets.
- Never put passwords, API keys, service-role keys, or employee personal data in docs.

## Accuracy

- Write *shipped* behaviour in present tense. Mark unfinished work as *not shipped* or *ops pending*.
- Don't describe a plan as if it already runs.
- When behaviour changes, update the source doc in the same change. Then update memory if the fact is durable.
- Record user-visible shipped work in [CHANGELOG.md](../CHANGELOG.md) under `[Unreleased]` until you tag a release.

## Hierarchy

When documents disagree:

1. Approved ADR
2. PRD
3. Architecture and database
4. Design and components
5. Coding rules and this style guide
6. Roadmap
7. Tasks
8. Memory

## Audit

Review this set when you ship a milestone or close a PRD surface. Check:

- Abstracts still describe the page
- Dates and status lines match the product
- How-to steps still match the UI
- Planned vs shipped language
- Cross-links resolve
- No secrets or personal data

Last full audit: 2026-08-14. Soft launch is `1.0.0`. M7.1 remaining work is T-071–T-073. M8 is shipped except passkeys (T-087). Production DNS and Vercel env remain ops pending.

## See Also

- [Documentation index](../README.md)
- [Coding rules](CODING_RULES.md)
- [Glossary](../memory/PROJECT_GLOSSARY.md)
- [Apple Style Guide](https://support.apple.com/guide/applestyleguide/welcome/web)
