---
id: TICKET-047
title: Add Open Graph previews for IV links without guest details
epic: invitations
status: in_review
priority: urgent
estimate: M
labels: [frontend, design, security]
module: invitations
owner: divine
agent: codex
blocked_by: [TICKET-037]
blocks: [TICKET-120, TICKET-138, TICKET-176]
branch: TICKET-047
pr: https://github.com/UncleChenna/wedding-app/pull/160
created: 2026-10-21
updated: 2026-11-12
started: 2026-10-31
completed: ""
reason: ""
resume_to: ""
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
- [x] Preview delivery records the unverified physical WhatsApp check and nonzero CLS in the existing release-blocking TICKET-201 scope, under the owner-approved preview exception. This is evidence disposition, not a phone-test pass.

## Test plan

- End-to-end: Meta tag assertions.
- Manual: Paste a link in WhatsApp.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/app/(guest)/i/[token]/opengraph-image.tsx`
- `src/app/layout.tsx`

## Notes / decisions

2026-10-31: Approved Unsplash placeholder implemented in four themed1200x630 PNGs. Two synthetic invitation crawler checks prove identical metadata without guest names, tokens or IDs. Full verify:491 unit tests,529 browser tests pass. Draft PR https://github.com/UncleChenna/wedding-app/pull/60. Physical WhatsApp remains unverified; homepage Lighthouse99/100/100 and Accessibility100, but CLS0.00007339025002649255 does not meet zero. Evidence docs/reviews/TICKET-047/README.md. Release-blocking201 retains these requirements; no phone pass or release approval claimed.

### 2026-11-12 — merged preview reconciliation

PR #60 merged on 2026-11-01 as `6ebd4b474928a5289d8e294b95d64c019ba98319`; its tested head was `b3df9446973c6baf30c5ae29b92f4e5eb484e55c`. Required checks succeeded in CI run `41304954441`. The old blocked status and empty PR field did not reflect that merge. This documentation follow-up starts from develop `eb14549758ac20fdb286325c7aa57ce42605b564`; it changes no product code.

The owner approved preview delivery with remaining device/performance checks kept separately (TICKET-201 context). The original requirement, **WhatsApp preview checked on a phone (screenshot in notes)**, remains unverified and mandatory before guest release in TICKET-201’s public Open Graph/physical iOS and Android scope. The earlier measured homepage CLS `0.00007339025002649255` remains a failure against the exact-zero release criterion. Neither requirement is waived, and no physical screenshot or new measurement is claimed. TICKET-201 continues to block both releases.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-31 — todo → claimed — divine (codex)
- 2026-10-31 — todo → in_progress — divine (codex)
- 2026-10-31 — in_progress → blocked — divine (codex) — Draft PR https://github.com/UncleChenna/wedding-app/pull/60 passes full verification; physical WhatsApp preview and measured homepage nonzero CLS remain unresolved, retained in release-blocking TICKET-201
- 2026-11-12 — blocked → in_progress — divine (codex) — Reconcile merged PR 60 under approved preview delivery; physical WhatsApp and exact-zero CLS remain mandatory in release-blocking TICKET-201.
- 2026-11-12 — in_progress → in_review — divine (codex)
