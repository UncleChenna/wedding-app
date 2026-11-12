---
id: TICKET-180
title: Preserve queued events across worker and data upgrades
epic: pwa
status: done
priority: high
estimate: M
labels: [pwa, test]
module: checkin
owner: divine
agent: codex
blocked_by: [TICKET-066, TICKET-105]
blocks: [TICKET-111, TICKET-154]
branch: TICKET-180
pr: https://github.com/UncleChenna/wedding-app/pull/169
created: 2026-10-21
updated: 2026-11-12
started: 2026-11-12
completed: 2026-11-12
reason: ""
resume_to: ""
---

# TICKET-180: Preserve queued events across worker and data upgrades

## Context

Backlog audit coverage: PWA update, CHK-6. See [PRD](../docs/prd.md) and [audit](AUDIT.md).

## Scope

- Test worker and IndexedDB upgrades while admissions remain unsynced.
- Supply the queue-safe activation protocol consumed by TICKET-111; retain version-1 journal compatibility through additive upgrades.

## Out of scope

- The visible update prompt and launch operations remain in their linked tickets (TICKET-111 and release QA).

## Acceptance criteria

- [x] A version N queue survives installation of N+1, reload, tab closure and schema migration with stable event ids and no missing or duplicate events.
- [x] The activation API for TICKET-111’s update prompt defers activation until queued events are acknowledged or the approved safe migration path is confirmed; multiple tabs receive a coherent pending state.
- [x] Old/new client compatibility and rollback are explicit; incompatible migrations fail safely without clearing queues or caches containing the only copy of events.

## Test plan

- End-to-end: serve two actual worker versions, queue offline scans, upgrade/reload/reconnect and compare persisted ids to server acknowledgements. Repeat with interrupted migration and an older app version.
- Gate: `pnpm verify`; UI work also records the design checklist at 375/768/1280 in every theme.

## Files likely touched

- src/modules/checkin/; service worker; e2e/

## Notes / decisions

- 2026-10-21 — Added by HARNESS-002. All criteria describe future work; no completion or human approval is implied.

- 2026-11-12 — Actual Chromium/WebKit worker upgrades, additive IDB migration, interrupted transaction and compatible rollback preserve exact IDs. Pre-180 pinned readers reject version 2 without altering evidence. All-tab closure retains incompatible journals/caches. TICKET-111 consumes the tested activation protocol and supplies the visible prompt.
- 2026-11-12 — Independent review fixed cleanup atomicity; compatibility read and all activation cleanup now share the scanner lock. Focused tests and browser evidence are recorded in `docs/plans/TICKET-180-pr.md`; physical release QA is not claimed.

## Activity log

- 2026-10-21 — new → todo — divine
- 2026-11-12 — todo → claimed — divine (codex)
- 2026-11-12 — todo → in_progress — divine (codex)
- 2026-11-12 — in_progress → in_review — divine (codex)
- 2026-11-12 — in_review → done — divine (codex)
