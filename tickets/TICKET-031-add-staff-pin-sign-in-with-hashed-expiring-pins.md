---
id: TICKET-031
title: Add staff PIN sign-in with hashed, expiring PINs
epic: data-auth
status: done
priority: urgent
estimate: M
labels: [security, backend]
module: shared
owner: divine
agent: codex
blocked_by: [TICKET-172, TICKET-025, TICKET-169]
blocks: [TICKET-027, TICKET-032, TICKET-033, TICKET-059, TICKET-064, TICKET-076, TICKET-096, TICKET-173, TICKET-185]
branch: TICKET-031
pr: https://github.com/UncleChenna/wedding-app/pull/84
created: 2026-10-21
updated: 2026-11-04
started: 2026-11-03
completed: 2026-11-04
reason: ""
resume_to: ""
---

# TICKET-031: Add staff PIN sign-in with hashed, expiring PINs

## Context

Gate, kitchen and bar staff use PINs on dedicated pages; PINs expire after the event and attempts are rate-limited.

See: [Users and roles](../docs/prd.md#users-and-roles) · [Security](../docs/prd.md#security).

## Scope

- 6-digit PINs hashed with scrypt; constant-time compare.
- Signed, httpOnly staff session cookie bound to role and device.
- 5 failed attempts per device per 10 minutes, then lockout.

## Out of scope

- Staff management UI (TICKET-096).

## Acceptance criteria

- [x] Wrong PIN, expired PIN and locked-out device each return a distinct friendly state (tested).
- [x] PIN hashes never leave the server; the session holds role and staff id only.
- [x] A gate PIN cannot open the kitchen board and vice versa.

## Test plan

- Unit: Hashing, expiry and lockout.
- End-to-end: PIN entry on /checkin.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/shared/server/staff-auth.ts`
- `src/app/(staff)/`

## Notes / decisions

- 2026-11-03: Approved migration and authorization record committed; only the isolated local database was changed. Draft PR84 contains staff PIN entry, lockout, expiry and role isolation. Full verification passes (878 unit / 775 browser; opt-in skips documented); three isolated database tests and both production staff journeys pass. The owner approved proceeding to review on 2026-11-04 while retaining physical-device checks as mandatory release evidence in TICKET-201; this is not a physical-device pass or merge approval. Session identity is staff ID and role, plus required expiry/issue-time/credential-version security metadata; no PIN/hash/name/email enters the session.

- 2026-11-04: Integrated develop e051979 after the approved PR83 merge. Rerunning the full review gate on the integrated branch.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-03 — todo → claimed — divine (codex)
- 2026-11-03 — todo → in_progress — divine (codex)
- 2026-11-03 — in_progress → blocked — divine (codex) — Automated verification passes; awaiting physical staff-device review evidence or user-approved deferral before advancing draft PR84.
- 2026-11-04 — blocked → in_progress — divine (codex) — User approved proceeding to review with physical staff-device checks retained as release requirements.
- 2026-11-04 — in_progress → in_review — divine (codex)
- 2026-11-04 — in_review → done — divine (codex)
