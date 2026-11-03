---
id: TICKET-107
title: Keep the guest's own QR pass available offline once opened
epic: pwa
status: in_progress
priority: urgent
estimate: M
labels: [pwa, frontend]
module: invitations
owner: divine
agent: codex
blocked_by: [TICKET-044, TICKET-105]
blocks: [TICKET-113, TICKET-138, TICKET-176, TICKET-184]
branch: TICKET-107
pr: https://github.com/UncleChenna/wedding-app/pull/78
created: 2026-10-21
updated: 2026-11-03
started: 2026-11-02
completed: ""
reason: ""
resume_to: ""
---

# TICKET-107: Keep the guest's own QR pass available offline once opened

## Context

At a gate with no signal, a guest reopening their link should still see their pass.

See: [Journey 1: receiving the IV and RSVP](../docs/prd.md#journey-1-receiving-the-iv-and-rsvp) · [Connectivity plan](../docs/prd.md#connectivity-plan-signal-unknown).

## Scope

- Cache the guest's own pass page and QR after first view; nobody else's.
- Shows a 'saved for offline' hint.

## Out of scope

- Wallet passes.

## Acceptance criteria

- [x] After one online visit, /i/<token> shows the QR offline (e2e).
- [x] Visiting another token does not expose the first guest's pass (test).

- [x] Show that the saved pass is an offline copy with its last refresh time, isolate it by capability, and remove a known-revoked copy on reconnect.

## Test plan

- End-to-end: Offline pass.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: End-to-end: guest A/B link switch, revocation after save, storage eviction and offline reload.

## Files likely touched

- `src/app/sw.ts`
- `src/modules/invitations/`

## Notes / decisions

2026-11-02 — Minimal own-pass cache and save hint implemented. Production offline test proves signed QR validity, A/B isolation, timestamps, reconnect revocation/decline and eviction. Full verification passes: 783 unit tests and 769 browser checks; 41/165 skipped. Lighthouse 99/100/100, accessibility 100 and CLS 0. Physical device checks remain release-blocking in TICKET-201 under the approved preview exception; expiry/logout/retention remain TICKET-184. See docs/reviews/TICKET-107/REVIEW.md and the handoff.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-02 — todo → claimed — divine (codex)
- 2026-11-02 — todo → in_progress — divine (codex)
- 2026-11-02 — in_progress → in_review — divine (codex)
- 2026-11-03 — in_review → in_progress — divine (codex) — Resolve integration conflict with approved PR76 before merging PR78
