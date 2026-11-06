---
id: TICKET-216
title: Integrate household foundation and verify PM phase zero
epic: foundations
status: in_progress
priority: urgent
estimate: L
labels: [db, test, infra, docs]
module: shared
owner: ihemegodsfavour8-lang
agent: codex
blocked_by: []
blocks: []
branch: TICKET-216
pr: ""
created: 2026-11-05
updated: 2026-11-05
started: 2026-11-05
completed: ""
reason: ""
resume_to: ""
---

# TICKET-216: Integrate household foundation and verify PM phase zero

## Context

The owner's PM direction dated 2026-11-05 authorizes Phase 0 of the consolidated implementation brief. Reconcile PR #92 with freshly fetched develop before Phase 1 reuses TICKET-212. Preserve the detailed approved decisions and their evidence against the historical [PRD](../docs/prd.md). Existing implementation and local work must survive; testing status is separate from PM acceptance.

## Scope

- Preserve the full approved brief, PM execution direction, decision register and detailed requirements checklist in version control, using the six PM status labels.
- Create a dedicated managed integration worktree outside iCloud without moving or deleting the original dependency caches or changing dependency versions.
- Review and reconcile both branches' intended RSVP, invitation, ordering, staff, seed and harness behavior; preserve develop's applied migration chain and use Drizzle-generated append-only artifacts with exact-path human source approval where required.
- Verify clean and representative populated local database paths, membership/mixed attendance/diet, retries, concurrent edits, deadlines/reopening, history and legacy preservation.
- Investigate default-worker failures using traces and isolated state; retain assertions, timeouts, retries and protections.
- Push a reviewable integration commit and draft PR, obtain its CI results or exact external blocker, and provide the Phase 0 checkpoint.

## Out of scope

- PM acceptance, merging shared develop/main, hosted execution, real guest messages, paid services or repository security changes.
- Phase 1 HTTP/browser session wiring is subsequent work reusing TICKET-212; helper implementation alone is not the completed guest journey.
- TICKET-215's separately owned approval/verification harness changes and TICKET-213's separately owned database-platform proposal.
- Destructive legacy execution without its target-specific plan, verified backup, restore rehearsal and explicit execution authorization.

## Acceptance criteria

- [ ] Version-controlled approved decisions and detailed requirements cover the full brief, PM phase ordering and explicit missing decisions; no phase is labelled PM accepted without explicit acceptance.
- [ ] A dedicated claimed managed branch records its fresh develop base and integrates both intended behaviors with documented conflict resolutions.
- [ ] Applied migration contents/order remain intact; approved generated integration artifacts match the reconciled schema and pass clean/populated local checks without hosted execution.
- [ ] Required RSVP behavior, concurrency, retry, deadline, reopening and history checks pass on the integrated commit, with actual skipped/unverified cases identified.
- [ ] Default-worker failures are investigated with preserved traces and supported attribution or an explicit unresolved finding; no test or protection is weakened.
- [ ] The checkpoint records the exact pushed commit, draft PR, CI evidence, remaining external blockers and recovery limits for PM review.

## Test plan

- Unit: scoped RSVP and request validation, branch behavior regressions, relevant hook/fixture protections and full required verification.
- Integration: isolated clean migration, migrate twice/count comparison, RLS, representative populated upgrade, individual/family/group member responses, history and concurrent/retry cases.
- End-to-end: real local RSVP journeys and unchanged default-worker keyboard cases using controlled server lifecycle and synthetic fixtures; record skips, failures and traces.
- Manual: inspect both sides of every conflict, migration SQL/history hashes, requirements mapping and final-commit CI; no hosted mutation.

## Files likely touched

- docs/approved-requirements-2026-11-02.md, docs/implementation-checklist.md, decision register, PM direction, per-phase status, plans and this ticket's handoff.
- src/modules/invitations, src/modules/shared/server/db/schema.ts, relevant e2e and integration tests, seed/migration tooling and approved generator-produced drizzle artifacts.

## Notes / decisions

- 2026-11-06 — Generator-only preview: three guarded local cases pass; nine lineage contracts pass but execution wiring is pending. Default four-worker production baseline: 72 envelope and 78 letter cases pass. Original timeout unresolved. Actual source merge awaits fresh human record. No PM acceptance.

- 2026-11-05 — Explicit PM assignment takes precedence over the automatic next suggestion. TICKET-215 is separately owned and in review; do not duplicate or merge its work. Preserve the original Desktop checkouts and caches, and use a fresh local clone for the managed integration worktree. PM acceptance remains a distinct explicit decision.

## Activity log

- 2026-11-05 — new → todo — ihemegodsfavour8-lang (codex)
- 2026-11-05 — todo → claimed — ihemegodsfavour8-lang (codex)
- 2026-11-05 — todo → in_progress — ihemegodsfavour8-lang (codex)
