---
id: TICKET-108
title: Make the scanner app shell work fully offline
epic: pwa
status: blocked
priority: high
estimate: M
labels: [pwa, frontend]
module: checkin
owner: divine
agent: codex
blocked_by: [TICKET-059, TICKET-105, TICKET-169]
blocks: [TICKET-065, TICKET-113, TICKET-136]
branch: TICKET-108
pr: ""
created: 2026-10-21
updated: 2026-11-09
started: 2026-11-09
completed: ""
reason: "Offline document and decoder integration awaits verified TICKET-059 camera merge; storage/runtime foundation verified and pushed in draft PR142."
resume_to: in_progress
---

# TICKET-108: Make the scanner app shell work fully offline

## Context

Scanners must load and scan even if the device reloads with no signal.

See: [Gate check-in](../docs/prd.md#gate-check-in) (CHK-6).

## Scope

- Precache scanner route, scanner JS and decoder assets.
- Staff session survives offline reload until expiry.

## Out of scope

- Data cache (TICKET-065).

## Acceptance criteria

- [ ] An offline reload of /checkin shows the scanner ready (e2e).
- [ ] Decoder assets are precached (test lists them).

## Test plan

- End-to-end: Offline reload.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/app/sw.ts`
- `src/modules/checkin/`

## Notes / decisions

- 2026-11-09: Added isolated scanner-shell authorization storage; 16 Chromium/WebKit storage tests and quick lint/types pass. Worker navigation, asset caching and real offline decoding remain unfinished in draft PR142; see the ticket handoff.

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-09 — todo → claimed — divine (codex) — started ahead of TICKET-059 (in_review)
- 2026-11-09 — todo → in_progress — divine (codex) — started ahead of TICKET-059 (in_review)
- 2026-11-09 — in_progress → blocked — divine (codex) — Offline document and decoder integration awaits verified TICKET-059 camera merge; storage/runtime foundation verified and pushed in draft PR142.
