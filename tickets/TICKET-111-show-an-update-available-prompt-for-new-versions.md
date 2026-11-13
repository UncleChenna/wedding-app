---
id: TICKET-111
title: Show an update-available prompt for new versions
epic: pwa
status: in_review
priority: high
estimate: M
labels: [pwa, frontend]
module: shared
owner: divine
agent: codex
blocked_by: [TICKET-105, TICKET-066, TICKET-180]
blocks: [TICKET-113]
branch: TICKET-111
pr: https://github.com/UncleChenna/wedding-app/pull/176
created: 2026-10-21
updated: 2026-11-13
started: 2026-11-13
completed: ""
reason: ""
resume_to: ""
---

# TICKET-111: Show an update-available prompt for new versions

## Context

Staff devices must pick up fixes on the day without losing queued check-ins.

See: [Tech stack and architecture](../docs/prd.md#tech-stack-and-architecture).

## Scope

- Detect a waiting worker; toast with Reload; never auto-reload while the offline queue is non-empty.

## Out of scope

- Forced updates.

## Acceptance criteria

- [x] A new build triggers the prompt (e2e with two builds or simulated waiting worker).
- [x] Reload is blocked while check-ins are pending (unit).

- [x] Use TICKET-180 queue-safe activation; defer updates while scans are pending and preserve events across multiple tabs and worker/schema changes.

## Test plan

- Unit: Update guard.
- End-to-end: Update flow.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: End-to-end: actual N/N+1 workers with unsynced events, decline/accept update and interrupted reload.

## Files likely touched

- `src/modules/shared/components/`

## Notes / decisions

- 2026-11-13: Shared update notification and offline scanner integration implemented. Fifteen focused tests, six real Chromium/WebKit worker upgrade cases, production build and twelve all-theme screenshots/axe/keyboard checks pass. Independent review found no blockers. Physical-device and fresh page-performance checks stay unchecked in TICKET-201 under the approved preview disposition. Integration base:3be8bd693d4a880f11bf72e177519161948e954e.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-13 — todo → claimed — divine (codex)
- 2026-11-13 — todo → in_progress — divine (codex)
- 2026-11-13 — in_progress → in_review — divine (codex)
