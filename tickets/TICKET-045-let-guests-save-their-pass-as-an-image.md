---
id: TICKET-045
title: Let guests save their pass as an image
epic: invitations
status: in_progress
priority: urgent
estimate: M
labels: [frontend, backend]
module: invitations
owner: divine
agent: codex
blocked_by: [TICKET-044]
blocks: [TICKET-131, TICKET-138, TICKET-158, TICKET-176]
branch: TICKET-045
pr: ""
created: 2026-10-21
updated: 2026-11-02
started: 2026-11-02
completed: ""
reason: ""
resume_to: ""
---

# TICKET-045: Let guests save their pass as an image

## Context

"Save to Photos" gives guests a screenshot-free copy that works at a gate with no signal.

See: [Invitations and RSVP](../docs/prd.md#invitations-and-rsvp) (INV-5) · [Journey 1: receiving the IV and RSVP](../docs/prd.md#journey-1-receiving-the-iv-and-rsvp).

## Scope

- PNG endpoint rendering the themed pass (name, party size, QR).
- Download/share button that works in WhatsApp's in-app browser (fallback: open image in new tab with save hint).

## Out of scope

- Wallet passes (out of v1; see docs/current-state.md).

## Acceptance criteria

- [x] The PNG is ≥1080px wide, the QR in it decodes, and it contains no data beyond name and party size.
- [x] The endpoint only serves a valid, non-revoked token (tested).
- [x] Automated PNG download, sharing cancellation and open-image fallback pass; the original mandatory iOS Safari/Android Chrome manual download requirement is retained unchecked in release-blocking TICKET-201 under the approved preview-QA exception.

## Test plan

- Unit: PNG decode test.
- Manual: iOS and Android save-to-photos check.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/app/(guest)/i/[token]/pass.png/route.ts`

## Notes / decisions

2026-11-02 — The owner previously approved preview delivery with remaining device QA tracked separately. The original requirement “Download works on iOS Safari and Android Chrome (manual, recorded)” remains mandatory in TICKET-201 and is not claimed passed here. No release dependency is removed.

Implementation uses only local font outlines so private names never reach Next ImageResponse's remote missing-glyph lookup. Unsupported glyphs fail locally with screenshot advice; no silent name truncation. No new dependency, migration or protected file change.

2026-11-02 — Seven focused tests and the full gate pass (779 unit/769 browser; 41/165 skipped). Final dedicated production flow passes in 7.5s; twelve screenshot combinations and all theme PNGs inspected. Lighthouse 99/100/100 with accessibility 100 and CLS 0. See docs/reviews/TICKET-045/REVIEW.md for the retained physical-device limitations.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-02 — todo → claimed — divine (codex)
- 2026-11-02 — todo → in_progress — divine (codex)
