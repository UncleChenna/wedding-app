---
id: TICKET-067
title: Flag and resolve double entries from offline scanners
epic: checkin
status: done
priority: high
estimate: M
labels: [frontend, backend]
module: checkin
owner: divine
agent: codex
blocked_by: [TICKET-066, TICKET-033, TICKET-088]
blocks: [TICKET-136, TICKET-154]
branch: TICKET-067
pr: https://github.com/UncleChenna/wedding-app/pull/172
created: 2026-10-21
updated: 2026-11-13
started: 2026-11-12
completed: 2026-11-13
reason: ""
resume_to: ""
---

# TICKET-067: Flag and resolve double entries from offline scanners

## Context

Two offline devices can admit the same IV; the system must flag the over-admission and show who, when and where.

See: [Gate check-in](../docs/prd.md#gate-check-in) (CHK-6).

## Scope

- Server marks conflicting admissions beyond allowance.
- Gate and admin conflict list with device and staff details.
- Resolution notes.

## Out of scope

- Automatic reversal.

## Acceptance criteria

- [x] Two devices each admitting 4 of 4 offline produce one flagged conflict after sync (unit + e2e).
- [x] The conflict appears on every scanner within 2 seconds of sync.

## Test plan

- Unit: Conflict detection.
- End-to-end: Two-context offline test.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/checkin/`

## Notes / decisions

- 2026-11-13 — Hosted production two-device sync passes in both projects: mobile851ms, desktop828ms, one flagged conflict, canonical admitted count4. All-theme axe/375px screenshots inspected. CI43318217477 passes all ten jobs at38de17eb; detailed evidence in docs/plans/TICKET-067-pr.md. Physical-device release checks remain unverified.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-12 — todo → claimed — divine (codex)
- 2026-11-12 — todo → in_progress — divine (codex)
- 2026-11-13 — in_progress → in_review — divine (codex)
- 2026-11-13 — in_review → done — divine (codex)
