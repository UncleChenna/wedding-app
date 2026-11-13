---
id: TICKET-184
title: Expire private offline data and recover from storage eviction
epic: pwa
status: in_review
priority: high
estimate: M
labels: [pwa, security, test]
module: shared
owner: divine
agent: codex
blocked_by: [TICKET-065, TICKET-107]
blocks: [TICKET-113, TICKET-129, TICKET-136, TICKET-168]
branch: TICKET-184
pr: https://github.com/UncleChenna/wedding-app/pull/173
created: 2026-10-21
updated: 2026-11-13
started: 2026-11-12
completed: ""
reason: ""
resume_to: ""
---

# TICKET-184: Expire private offline data and recover from storage eviction

## Context

Backlog audit coverage: PWA privacy, CHK-6. See [PRD](../docs/prd.md) and [audit](AUDIT.md).

## Scope

- Define private offline cache expiry, logout and storage-failure behavior.

## Out of scope

- New consuming screens and physical-device launch certification. Post-expiry administrator recovery is tracked in release-blocking TICKET-231; this ticket preserves evidence without extending credentials.

## Acceptance criteria

- [x] Apply TICKET-169 freshness and device-expiry rules; logout/expiry removes private lookup data without silently discarding pending scan evidence.
- [x] Guest cache is scoped to the authorized pass; switching links never displays another household and online revocation removes the known invalid copy.
- [x] Handle storage eviction, quota failure and unavailable IndexedDB with clear recovery instructions and no false offline-ready/admitted state.
- [x] Exclude dietary notes and secrets from scanner caches; document purge after the event and preserve pending evidence until acknowledged through the approved recovery path.

## Test plan

- End-to-end: expired staff session, guest-link switching, known revocation, quota/eviction injection, reload and eventual sync. Manual: repeat storage/recovery behavior on iOS and Android.
- Gate: `pnpm verify`; UI work also records the design checklist at 375/768/1280 in every theme.

## Files likely touched

- src/modules/shared/; src/modules/checkin/; src/modules/invitations/

## Notes / decisions

- 2026-11-12 — Implemented bounded own-pass retention, acknowledged-only cleanup and partial-eviction identity checks. Actual worker/storage browser suite: 36 passed. Expired staff evidence stays retained; TICKET-231 must provide administrative recovery before release. Full-origin loss is unrecoverable; physical-device QA remains a release gate.
- 2026-10-21 — Added by HARNESS-002. All criteria describe future work; no completion or human approval is implied.

## Activity log

- 2026-10-21 — new → todo — divine
- 2026-11-12 — todo → claimed — divine (codex)
- 2026-11-12 — todo → in_progress — divine (codex)
- 2026-11-12 — in_progress → in_review — divine (codex)
- 2026-11-13 — in_review → in_progress — divine (codex) — Align private-cache smoke assertion with validated non-private queue identity marker
- 2026-11-13 — in_progress → in_review — divine (codex)
