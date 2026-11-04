---
id: TICKET-101
title: Build the event settings page
epic: admin
status: in_progress
priority: urgent
estimate: M
labels: [frontend, backend]
module: admin
owner: unclechenna
agent: claude
blocked_by: [TICKET-025, TICKET-088, TICKET-034, TICKET-035]
blocks: [TICKET-154, TICKET-176]
branch: TICKET-101
pr: ""
created: 2026-10-21
updated: 2026-11-04
started: 2026-11-04
completed: ""
reason: ""
resume_to: ""
---

# TICKET-101: Build the event settings page

## Context

Couple names, date, venue, map, dress code, RSVP lock, ordering switch, limits, Wi-Fi details and voice live in one place.

See: [Journey 1: receiving the IV and RSVP](../docs/prd.md#journey-1-receiving-the-iv-and-rsvp) · [Table ordering](../docs/prd.md#table-ordering) (ORD-7) · [Current state](../docs/current-state.md).

## Scope

- Form for every event_settings field with validation and help text.

## Out of scope

- Theme editing.

## Acceptance criteria

- [x] Saving updates the IV page and limits immediately (e2e).
- [x] Invalid dates (lock after the wedding) are rejected (unit).

- [x] Draft settings can retain TBD details, but live publication/RSVP activation requires an explicitly configured valid event time zone; missing/invalid values must not become a development default.

## Test plan

- Unit: Validation.
- End-to-end: Edit settings.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/admin/`

## Notes / decisions

- 2026-10-26: Approved values are in docs/prd.md#approved-event-defaults (owner, 2026-10-26): Uchenna and Adaora; 2026-12-19; default one tag-along editable per invitation; lock at event-local midnight; retention 90 days. Venue, ceremony time, map, dress code and time zone are TBD. Wallet is deferred.

_Agents append dated notes here while working._

- 2026-11-04:
  - **Page.** `/admin/settings`, in the shell's navigation and the control-room grid. One form, in four groups (the
    couple, the day, replies, table ordering), for every `event_settings` field except the ordering switch
    (TICKET-080, control room) and themes (out of scope).
  - **Validation.** The form parses into the shared `eventSettingsSchema` (one source of rules) with plain-language
    messages.
    - The RSVP cutoff is typed in venue time and converted with `zonedLocalToUtc`, which handles daylight saving.
    - A cutoff after the start of the wedding day is refused, because replies lock then anyway.
    - A cutoff needs a real time zone.
    - Blank details stay `null` (TBD), and a blank time zone is never defaulted; replies only open once one is set
      (`rsvpWindow`).
  - **Immediate effect.** The personal invitation reads settings per request. The save also calls
    `revalidatePath("/", "layout")`, so the cached public pages refresh too. Order limits are read inside
    `createOrder` on every order.
  - **Not here:** Wi-Fi details (no column yet; table cards are TICKET-094).
  - **Owner decision still open:** the cooldown default (30 or 60 seconds). It can now simply be set on this page.
  - **Evidence.**
    - Unit: `settings-form.test.ts` (12).
    - Signed-in browser test, `e2e/admin-settings.spec.ts` (`RUN_ADMIN_SETTINGS_TESTS=1`, fresh `ADMIN_TEST_EMAIL` on
      the allowlist): a cutoff after the wedding is refused with the typed values kept; a valid save stores the cutoff
      as UTC; a real invitation shows the new venue on its next load; with cooldown 0 a table orders twice, and after
      saving 3600 the next order is refused with `cooldown`.
    - Axe once per theme; overflow at all widths.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-04 — todo → claimed — unclechenna (claude)
- 2026-11-04 — todo → in_progress — unclechenna (claude)
