---
id: TICKET-012
title: Store the active theme in the database and apply it on the server
epic: design-system
status: in_progress
priority: urgent
estimate: M
labels: [backend, db, frontend]
module: theming
owner: divine
agent: codex
blocked_by: [TICKET-011, TICKET-025]
blocks: [TICKET-103, TICKET-154, TICKET-176, TICKET-181]
branch: TICKET-012
pr: ""
created: 2026-10-21
updated: 2026-10-31
started: 2026-10-30
completed: ""
reason: ""
resume_to: ""
---

# TICKET-012: Store the active theme in the database and apply it on the server

## Context

THM-2: the active theme lives in the database so the couple can switch it without a deploy, and pages must never flash the wrong colours.

See: [How theming works](../docs/prd.md#how-theming-works) (THM-2).

## Scope

- Read the active theme id from `event_settings` (cached with Cache Components and tag invalidation).
- Fall back to the default theme when the DB is unreachable.
- Revalidate on activation.

## Out of scope

- Editing themes (TICKET-098).

## Acceptance criteria

- [ ] Changing the active theme in the DB restyles pages on the next request with no flash (server-rendered CSS variables).
- [ ] With the DB down, pages render in the default theme and log a warning.
- [ ] A unit test covers fallback.

## Test plan

- Unit: Theme resolver with DB stub.
- End-to-end: Switch theme via seed fixture and assert `data-theme` changes.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/theming/`
- `src/app/layout.tsx`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-30 — todo → claimed — divine (codex)
- 2026-10-30 — todo → in_progress — divine (codex)
- 2026-10-31 — in_progress → blocked — divine (codex) — Draft PR #56: awaiting exact-path migration artifact approval; seed, browser and full-gate work remain.
- 2026-10-31 — blocked → in_progress — divine (codex)
