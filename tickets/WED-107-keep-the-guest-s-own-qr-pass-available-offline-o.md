---
id: WED-107
title: Keep the guest's own QR pass available offline once opened
epic: pwa
status: todo
priority: high
estimate: M
labels: [pwa, frontend]
module: invitations
owner: ""
agent: ""
blocked_by: [WED-044, WED-105]
blocks: [WED-113]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-107: Keep the guest's own QR pass available offline once opened

## Context

At a gate with no signal, a guest reopening their link should still see their pass.

See: [Journey 1: receiving the IV and RSVP](../docs/prd.md#journey-1-receiving-the-iv-and-rsvp) · [Connectivity plan](../docs/prd.md#connectivity-plan-signal-unknown).

## Scope

- Cache the guest's own pass page and QR after first view; nobody else's.
- Shows a 'saved for offline' hint.

## Out of scope

- Wallet passes.

## Acceptance criteria

- [ ] After one online visit, /i/<token> shows the QR offline (e2e).
- [ ] Visiting another token does not expose the first guest's pass (test).

## Test plan

- End-to-end: Offline pass.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/app/sw.ts`
- `src/modules/invitations/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
