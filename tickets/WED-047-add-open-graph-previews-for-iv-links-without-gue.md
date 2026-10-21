---
id: WED-047
title: Add Open Graph previews for IV links without guest details
epic: invitations
status: todo
priority: urgent
estimate: M
labels: [frontend, design, security]
module: invitations
owner: ""
agent: ""
blocked_by: [WED-037]
blocks: [WED-120, WED-138, WED-176]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-047: Add Open Graph previews for IV links without guest details

## Context

Most guests open the IV from WhatsApp; the link preview should show the couple's photo, and must not leak names or tokens.

See: [Design principles](../docs/prd.md#design-principles) · [Design principles (repo)](../docs/design-principles.md) · [What "flawless" means in testing](../docs/prd.md#what-flawless-means-in-testing).

## Scope

- 1200×630 themed OG image via `next/og` or a static asset.
- Title and description for /i/[token] that are the same for every guest.
- Inherited defaults for other guest pages.

## Out of scope

- Per-guest previews (privacy).

## Acceptance criteria

- [ ] `/i/<token>` returns og:title, og:description and a 1200×630 og:image (e2e reads meta tags).
- [ ] No guest name or token appears in any meta tag (test).
- [ ] WhatsApp preview checked on a phone (screenshot in notes).

## Test plan

- End-to-end: Meta tag assertions.
- Manual: Paste a link in WhatsApp.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/app/(guest)/i/[token]/opengraph-image.tsx`
- `src/app/layout.tsx`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
