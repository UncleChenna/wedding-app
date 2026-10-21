---
id: TICKET-172
title: Migrate staff identities and device registrations
epic: data-auth
status: todo
priority: urgent
estimate: M
labels: [db, security]
module: shared
owner: ""
agent: ""
blocked_by: [TICKET-023]
blocks: [TICKET-024, TICKET-026, TICKET-027, TICKET-031]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-172: Migrate staff identities and device registrations

## Context

Backlog audit coverage: CHK-5, ADM-4. See [PRD](../docs/prd.md) and [audit](AUDIT.md).

## Scope

- Extract staff and device schema work from TICKET-024.

## Out of scope

- Work outside the stated contract; consuming screens and launch operations remain in their linked tickets. No product implementation is part of this audit.

## Acceptance criteria

- [ ] Migrate staff roles, hashed PIN credentials, expiry and revocation, and registered devices with stable identifiers.
- [ ] Store no raw PIN in staff rows, scan logs or seeds; devices and staff can be referenced by check-in events.
- [ ] Migration and seed work on empty and existing bootstrap databases; role/expiry constraints reject invalid rows.

## Test plan

- Integration: disposable migration and constraint tests; inspect seeded rows for raw credentials. Manual: review the identity/device lifecycle contract consumed by TICKET-031 and TICKET-064.
- Gate: `pnpm verify`; UI work also records the design checklist at 375/768/1280 in every theme.

## Files likely touched

- src/modules/shared/server/db/; drizzle/; scripts/seed.ts

## Notes / decisions

- 2026-10-21 — Added by HARNESS-002. All criteria describe future work; no completion or human approval is implied.

## Activity log

- 2026-10-21 — new → todo — divine
