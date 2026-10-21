---
id: WED-181
title: Persist validated theme drafts and activate them atomically
epic: design-system
status: todo
priority: high
estimate: M
labels: [backend, security]
module: theming
owner: ""
agent: ""
blocked_by: [WED-012, WED-032, WED-170]
blocks: [WED-098]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-181: Persist validated theme drafts and activate them atomically

## Context

Backlog audit coverage: THM-2, THM-3, THM-6. See [PRD](../docs/prd.md) and [audit](AUDIT.md).

## Scope

- Separate theme persistence and activation from the editor controls.

## Out of scope

- Work outside the stated contract; consuming screens and launch operations remain in their linked tickets. No product implementation is part of this audit.

## Acceptance criteria

- [ ] AAL2 admin-only draft save validates the canonical schema, curated fonts and contrast with named failing pairs before persistence.
- [ ] Activate performs an atomic active-theme switch and invalidates affected server caches; concurrent activations leave exactly one active theme.
- [ ] A fresh response contains the selected variables before hydration; failed validation cannot change the live invitation, order page or generated artifacts.

## Test plan

- Integration: unauthorized saves, invalid pairs and concurrent activation. End-to-end: inspect initial HTML and artifacts after activation and verify no flash of the old theme.
- Gate: `pnpm verify`; UI work also records the design checklist at 375/768/1280 in every theme.

## Files likely touched

- src/modules/theming/server/; src/modules/shared/server/db/

## Notes / decisions

- 2026-10-21 — Added by HARNESS-002. All criteria describe future work; no completion or human approval is implied.

## Activity log

- 2026-10-21 — new → todo — divine
