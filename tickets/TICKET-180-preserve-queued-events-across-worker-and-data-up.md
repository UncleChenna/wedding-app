---
id: TICKET-180
title: Preserve queued events across worker and data upgrades
epic: pwa
status: todo
priority: high
estimate: M
labels: [pwa, test]
module: checkin
owner: ""
agent: ""
blocked_by: [TICKET-066, TICKET-105]
blocks: [TICKET-111, TICKET-154]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-180: Preserve queued events across worker and data upgrades

## Context

Backlog audit coverage: PWA update, CHK-6. See [PRD](../docs/prd.md) and [audit](AUDIT.md).

## Scope

- Test worker and IndexedDB upgrades while admissions remain unsynced.

## Out of scope

- Work outside the stated contract; consuming screens and launch operations remain in their linked tickets. No product implementation is part of this audit.

## Acceptance criteria

- [ ] A version N queue survives installation of N+1, reload, tab closure and schema migration with stable event ids and no missing or duplicate events.
- [ ] Update prompt defers activation until queued events are acknowledged or the approved safe migration path is confirmed; multiple tabs show a coherent pending state.
- [ ] Old/new client compatibility and rollback are explicit; incompatible migrations fail safely without clearing queues or caches containing the only copy of events.

## Test plan

- End-to-end: serve two actual worker versions, queue offline scans, upgrade/reload/reconnect and compare persisted ids to server acknowledgements. Repeat with interrupted migration and an older app version.
- Gate: `pnpm verify`; UI work also records the design checklist at 375/768/1280 in every theme.

## Files likely touched

- src/modules/checkin/; service worker; e2e/

## Notes / decisions

- 2026-10-21 — Added by HARNESS-002. All criteria describe future work; no completion or human approval is implied.

## Activity log

- 2026-10-21 — new → todo — divine
