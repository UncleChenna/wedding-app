---
id: TICKET-068
title: Sync check-ins across scanners within two seconds
epic: checkin
status: in_review
priority: high
estimate: M
labels: [frontend, backend]
module: checkin
owner: divine
agent: codex
blocked_by: [TICKET-033, TICKET-061, TICKET-065]
blocks: [TICKET-137, TICKET-154]
branch: TICKET-068
pr: https://github.com/UncleChenna/wedding-app/pull/154
created: 2026-10-21
updated: 2026-11-12
started: 2026-11-10
completed: ""
reason: ""
resume_to: ""
---

# TICKET-068: Sync check-ins across scanners within two seconds

## Context

CHK-7 (Should): several scanners at once, check-ins visible across all devices within 2 seconds.

See: [Gate check-in](../docs/prd.md#gate-check-in) (CHK-7).

## Scope

- Subscribe to check-in events and update the local cache.
- Fallback polling when realtime drops.

## Out of scope

- Offline merge (TICKET-066).

## Acceptance criteria

- [x] An admission on device A shows as used on device B within 2s (e2e with two contexts).
- [x] With realtime blocked, polling updates within 15s.

## Test plan

- End-to-end: Two-context timing test.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/checkin/`

## Notes / decisions

2026-11-12: Actual two-context private Supabase WebSocket/polling tests prove both timing criteria, with persisted timing evidence and all-theme UI checks. Lost-response retry retains one immutable request and one admission. Independent review findings for stale cache replies and focus were fixed with regressions. Verified065 decoder integration passes58 focused tests. Physical-device/venue-network and performance release gates remain unverified. Final exact-head CI is still required before merge; no previous failure or cancelled run is completion evidence.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-10 — todo → claimed — divine (codex) — started ahead of TICKET-065 (in_review)
- 2026-11-10 — todo → in_progress — divine (codex) — started ahead of TICKET-065 (in_review)
- 2026-11-12 — in_progress → blocked — divine (codex) — Awaiting verified TICKET-065 decoder follow-up; switching to user-assigned targeted CI ticket.
- 2026-11-12 — blocked → in_progress — divine (codex) — Verified TICKET-065 decoder repair merged; resuming final combined integration.
- 2026-11-12 — in_progress → in_review — divine (codex)
- 2026-11-12 — in_review → in_progress — divine (codex) — Integrate verified manual scanner changes before final combined review
