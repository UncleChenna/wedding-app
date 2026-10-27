---
id: TICKET-025
title: Add event settings and RSVP change-log tables
epic: data-auth
status: in_progress
priority: urgent
estimate: M
labels: [db, backend]
module: shared
owner: divine
agent: codex
blocked_by: [TICKET-023]
blocks: [TICKET-012, TICKET-026, TICKET-027, TICKET-029, TICKET-031, TICKET-037, TICKET-040, TICKET-042, TICKET-052, TICKET-073, TICKET-080, TICKET-101]
branch: TICKET-025
pr: ""
created: 2026-10-21
updated: 2026-10-27
started: 2026-10-27
completed: ""
reason: ""
resume_to: ""
---

# TICKET-025: Add event settings and RSVP change-log tables

## Context

RSVP lock, ordering open/closed, active theme, tag-along default and retention all need one settings row; INV-6 needs every RSVP change logged.

See: [Invitations and RSVP](../docs/prd.md#invitations-and-rsvp) (INV-6) · [Table ordering](../docs/prd.md#table-ordering) (ORD-7) · [How theming works](../docs/prd.md#how-theming-works) (THM-2) · [Current state](../docs/current-state.md).

## Scope

- event_settings singleton: couple names, date, time zone, venue, map URL, dress code, rsvp_lock_at, ordering_open, active_theme_id, default_max_tag_alongs, retention_days, abuse limits.
- rsvp_changes: invitation_id, before/after JSON, changed_at, actor.
- Typed accessor in shared/server.

## Out of scope

- Admin settings UI (TICKET-101).

## Acceptance criteria

- [ ] Exactly one settings row can exist (constraint).
- [ ] Accessor returns typed defaults when unset.
- [ ] rsvp_changes rows are append-only (no update/delete grants).

## Test plan

- Unit: Accessor and constraint tests.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/shared/server/db/schema.ts`
- `src/modules/shared/server/settings.ts`
- `drizzle/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-27 — todo → claimed — divine (codex)
- 2026-10-27 — todo → in_progress — divine (codex)
