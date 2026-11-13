---
id: TICKET-098
title: Build the admin theme editor with preview and activate
epic: admin
status: done
priority: medium
estimate: M
labels: [frontend, design]
module: admin
owner: divine
agent: codex
blocked_by: [TICKET-181, TICKET-088]
blocks: []
branch: TICKET-098
pr: https://github.com/UncleChenna/wedding-app/pull/110
created: 2026-10-21
updated: 2026-11-09
started: 2026-11-08
completed: ""
reason: ""
resume_to: ""
---

# TICKET-098: Build the admin theme editor with preview and activate

## Context

THM-6 (Should): colour pickers, curated fonts, live preview of IV and order page, then Activate; THM-3 rejects failing contrast on save.

See: [How theming works](../docs/prd.md#how-theming-works) (THM-3, THM-6).

## Scope

- Curated font/token editor, live invitation/order preview and Activate controls using TICKET-181 persistence; no duplicate server persistence implementation.

## Out of scope

- Palette generator (TICKET-022).

## Acceptance criteria

- [x] Saving a failing theme shows each failing pair and does not save (e2e).
- [x] Activate restyles the guest site without deploy (e2e).

- [x] Use TICKET-181 for save/activate; show named contrast errors and prevent activation of invalid drafts while keeping the current live theme unchanged.

## Test plan

- End-to-end: Save, reject, activate.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: End-to-end: invalid draft, valid live preview, activation and initial server-rendered variables.

## Files likely touched

- `src/modules/admin/`
- `src/modules/theming/`

## Notes / decisions

2026-11-08: Functional criteria pass in the authenticated isolated browser journey. Full verification passed before the embedded-only layout correction; final quick/build/journey pass after it. See docs/reviews/TICKET-098/ui-review.md. Physical-device and fresh CLS/Lighthouse checks remain unverified; not marked done.

2026-11-08: Independent review corrections reject stale saved drafts atomically, remove embedded development navigation and preserve keyboard focus through order preview steps. Six isolated publication DB tests and the expanded authenticated browser journey pass; device/Lighthouse/CLS requirements remain unverified in TICKET-201.

2026-11-08: Final forced PR gate passes on develop 407fb68: 1,106 unit tests and 851 browser smoke tests passed (118/195 opt-in skips). Six publication DB tests and the authenticated editor journey pass. Independent corrections review found no blockers. TICKET-201 device/Lighthouse/CLS release gates remain unverified.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-08 — todo → claimed — divine (codex)
- 2026-11-08 — todo → in_progress — divine (codex)
- 2026-11-08 — in_progress → blocked — divine (codex) — PR #110 published; awaiting UI review exception for physical-device and fresh Lighthouse/CLS checks retained in TICKET-201. CI pending.
- 2026-11-08 — blocked → in_progress — divine (codex) — Apply independent PR review fixes; retain release gates
- 2026-11-08 — in_progress → in_review — divine (codex)
- 2026-11-09 — in_review → in_progress — divine (codex) — Integrate develop37e9202 harness improvements and refresh verification
- 2026-11-09 — in_progress → in_review — divine (codex)
