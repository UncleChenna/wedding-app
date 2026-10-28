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
updated: 2026-10-28
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

- [x] Exactly one settings row can exist (constraint).
- [x] Accessor returns typed defaults when unset.
- [x] rsvp_changes rows are append-only (no update/delete grants).

## Test plan

- Unit: Accessor and constraint tests.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/shared/server/db/schema.ts`
- `src/modules/shared/server/settings.ts`
- `drizzle/`

## Notes / decisions

- 2026-10-28: Reconciled stale blocked status against committed approved migrations e72852a. Six real database tests and15 defaults tests pass, including the public Drizzle accessor; migrations and seeds repeated with identical counts, RLS on all12 tables. Corrected raw-client date expectation. Evidence: docs/reviews/TICKET-025/verification.md. Full PR gate follows.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-27 — todo → claimed — divine (codex)
- 2026-10-27 — todo → in_progress — divine (codex)
- 2026-10-27 — in_progress → blocked — divine (codex) — Automatic approval review rejected migration generation: awaiting exact-path authorization for 0002/0003 SQL, snapshots and journal plus recording approval; review packet in draft PR44.
- 2026-10-28 — blocked → in_progress — divine (codex) — Existing approved migrations are committed and pushed as e72852a with passing CI; resume isolated acceptance verification and update stale handoff.
