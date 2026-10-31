---
id: TICKET-012
title: Store the active theme in the database and apply it on the server
epic: design-system
status: in_review
priority: urgent
estimate: M
labels: [backend, db, frontend]
module: theming
owner: divine
agent: codex
blocked_by: [TICKET-011, TICKET-025]
blocks: [TICKET-103, TICKET-154, TICKET-176, TICKET-181]
branch: TICKET-012
pr: https://github.com/UncleChenna/wedding-app/pull/56
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

- Read the active light/dark theme pair from `event_settings` (cached with Cache Components and tag invalidation).
- Fall back to the default theme when the DB is unreachable.
- Revalidate on activation.

## Out of scope

- Editing themes (TICKET-098).

## Acceptance criteria

- [x] Activating a validated light/dark pair persists both IDs and expires the tagged cache after the write; the next server request renders the pair without a client-side colour flash. Direct SQL changes use the documented cache lifetime.
- [x] With the DB down on a cache miss or refresh, pages render the default pair and log a sanitized warning; valid cached themes may remain until refresh.
- [x] A unit test covers fallback.

## Test plan

- Unit: Theme resolver with DB stub.
- End-to-end: Switch both theme slots in the isolated fixture and assert initial HTML, computed CSS and browser metadata with JavaScript disabled.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/theming/`
- `src/app/layout.tsx`

## Notes / decisions

2026-10-31: Persist the light/dark pair required by TICKET-204. Existing active_theme_id is the light slot; additive migration0004 supplies active_dark_theme_id. User explicitly approved the three generated artifacts. Atomic validated writes invalidate the named cache; direct SQL uses timed revalidation and cached valid settings may survive until refresh. No admin activation endpoint is exposed; TICKET-098/181 must authorize callers.

Tests: new service suite first failed before implementation;23 settings/service tests,3 cache-wiring tests,7 real DB tests and deterministic seed tests pass. Two migration runs and two seeds give identical respective counts; RLS enabled on all12 tables. Actual SQL-to-HTML browser matrix passes in all4 themes ×3 widths without JavaScript; axe passes. Full gate after privacy fix:442 unit/17 opt-in skips,451 browser/123 conditional skips. Added private no-store headers after the gate caught browser caching of admin placeholders.

UI: twelve captures inspected; home Lighthouse100/99/100 Performance,100 Accessibility. Tiny nonzero CLS0.00007339025 and physical WhatsApp remain TICKET-201 under the user's existing preview QA exception. This does not approve guest release. See docs/reviews/TICKET-012/README.md and handoff.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-30 — todo → claimed — divine (codex)
- 2026-10-30 — todo → in_progress — divine (codex)
- 2026-10-31 — in_progress → blocked — divine (codex) — Draft PR #56: awaiting exact-path migration artifact approval; seed, browser and full-gate work remain.
- 2026-10-31 — blocked → in_progress — divine (codex)
- 2026-10-31 — in_progress → in_review — divine (codex)
