---
id: WED-184
title: Expire private offline data and recover from storage eviction
epic: pwa
status: todo
priority: high
estimate: M
labels: [pwa, security, test]
module: shared
owner: ""
agent: ""
blocked_by: [WED-065, WED-107]
blocks: [WED-113, WED-129, WED-136, WED-168]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-184: Expire private offline data and recover from storage eviction

## Context

Backlog audit coverage: PWA privacy, CHK-6. See [PRD](../docs/prd.md) and [audit](AUDIT.md).

## Scope

- Define private offline cache expiry, logout and storage-failure behavior.

## Out of scope

- Work outside the stated contract; consuming screens and launch operations remain in their linked tickets. No product implementation is part of this audit.

## Acceptance criteria

- [ ] Apply WED-169 freshness and device-expiry rules; logout/expiry removes private lookup data without silently discarding pending scan evidence.
- [ ] Guest cache is scoped to the authorized pass; switching links never displays another household and online revocation removes the known invalid copy.
- [ ] Handle storage eviction, quota failure and unavailable IndexedDB with clear recovery instructions and no false offline-ready/admitted state.
- [ ] Exclude dietary notes and secrets from scanner caches; document purge after the event and preserve pending evidence until acknowledged through the approved recovery path.

## Test plan

- End-to-end: expired staff session, guest-link switching, known revocation, quota/eviction injection, reload and eventual sync. Manual: repeat storage/recovery behavior on iOS and Android.
- Gate: `pnpm verify`; UI work also records the design checklist at 375/768/1280 in every theme.

## Files likely touched

- src/modules/shared/; src/modules/checkin/; src/modules/invitations/

## Notes / decisions

- 2026-10-21 — Added by HARNESS-002. All criteria describe future work; no completion or human approval is implied.

## Activity log

- 2026-10-21 — new → todo — divine
