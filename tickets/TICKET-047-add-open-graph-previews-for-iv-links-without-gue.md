---
id: TICKET-047
title: Add Open Graph previews for IV links without guest details
epic: invitations
status: blocked
priority: urgent
estimate: M
labels: [frontend, design, security]
module: invitations
owner: divine
agent: codex
blocked_by: [TICKET-037]
blocks: [TICKET-120, TICKET-138, TICKET-176]
branch: TICKET-047
pr: ""
created: 2026-10-21
updated: 2026-10-31
started: 2026-10-31
completed: ""
reason: "Draft PR https://github.com/UncleChenna/wedding-app/pull/60 passes full verification; physical WhatsApp preview and measured homepage nonzero CLS remain unresolved, retained in release-blocking TICKET-201"
resume_to: in_progress
---

# TICKET-047: Add Open Graph previews for IV links without guest details

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

- [x] `/i/<token>` returns og:title, og:description and a 1200×630 og:image (e2e reads meta tags).
- [x] No guest name or token appears in any meta tag (test).
- [ ] WhatsApp preview checked on a phone (screenshot in notes).

## Test plan

- End-to-end: Meta tag assertions.
- Manual: Paste a link in WhatsApp.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/app/(guest)/i/[token]/opengraph-image.tsx`
- `src/app/layout.tsx`

## Notes / decisions

2026-10-31: Approved Unsplash placeholder implemented in four themed1200x630 PNGs. Two synthetic invitation crawler checks prove identical metadata without guest names, tokens or IDs. Full verify:491 unit tests,529 browser tests pass. Draft PR https://github.com/UncleChenna/wedding-app/pull/60. Physical WhatsApp remains unverified; homepage Lighthouse99/100/100 and Accessibility100, but CLS0.00007339025002649255 does not meet zero. Evidence docs/reviews/TICKET-047/README.md. Release-blocking201 retains these requirements; no phone pass or release approval claimed.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-31 — todo → claimed — divine (codex)
- 2026-10-31 — todo → in_progress — divine (codex)
- 2026-10-31 — in_progress → blocked — divine (codex) — Draft PR https://github.com/UncleChenna/wedding-app/pull/60 passes full verification; physical WhatsApp preview and measured homepage nonzero CLS remain unresolved, retained in release-blocking TICKET-201
