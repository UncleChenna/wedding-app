---
id: TICKET-211
title: Build the approved household RSVP and migration foundation
epic: foundations
status: in_review
priority: medium
estimate: L
labels: [backend, db, test, docs]
module: shared
owner: ihemegodsfavour8-lang
agent: codex
blocked_by: []
blocks: []
branch: TICKET-211
pr: https://github.com/UncleChenna/wedding-app/pull/92
created: 2026-11-02
updated: 2026-11-03
started: 2026-11-02
completed: ""
reason: ""
resume_to: ""
---

# TICKET-211: Build the approved household RSVP and migration foundation

## Context

The owner supplied a revised end-to-end product mandate on 2026-11-02. It supersedes conflicting historical assumptions in [the PRD](../docs/prd.md), including household-wide RSVP, unrestricted table ordering, shared staff PINs and 90-day retention. This ticket begins phase A and establishes the member RSVP transaction needed by later phases. It does not claim the whole application is complete.

## Scope

- Record the complete owner mandate and a requirements-to-implementation checklist.
- Recheck the audit against develop 2f066ebbb175c4b8d42b0ab6f54545134f52f592.
- Preserve existing data and migration history; provide an explicit safe populated-bootstrap upgrade path.
- Add member attendance, optimistic revisions and scoped idempotency foundations with RLS enabled and no browser policies.
- Implement and verify transactional member RSVP/cutoff/history behavior and preserve compatibility with current invitation/pass data.
- Document rollout, recovery and external launch blockers.

- Owner-requested verification repairs: portable Git checks, disposable hook fixtures and the existing upstream streamed-page readiness assertion.

## Out of scope

- Other owners' active branches, public deployment, production migration/reset or real guest messaging.
- Claiming complete access, seating, orders, delivery, WhatsApp, retention, backup or visual-fidelity implementation; these remain explicit checklist phases.

## Acceptance criteria

- [x] Every section of the supplied mandate maps to current evidence, status and launch work.
- [x] Populated bootstrap and current-schema upgrades preserve representative individual/family/group records, contacts, check-ins and RSVP meaning without rewriting committed migration files.
- [x] Per-member responses enforce invitation scope, one current response, revision conflicts, replay-safe idempotency, deadlines and atomic history.
- [x] Fresh migrations and repeat migrations pass; all public tables retain RLS and no broad browser policies.
- [x] Relevant checks and the full project gate pass, with external/device/provider limitations recorded separately.
- [x] Rollout/recovery notes and a reviewable branch/PR state are available without launching publicly.

## Test plan

- Unit: request validation, fingerprinting, deadlines and boundary outcomes.
- Integration: populated old/current schema upgrades; household membership, mixed attendance, replay/conflict and concurrent updates in the isolated worktree database.
- Manual: inspect migration SQL and reconciliation counts; compare current routes with historical audit findings.

## Files likely touched

- src/modules/shared/server/db/schema.ts and generated drizzle migrations.
- src/modules/invitations/server and lib; scripts migration tooling and regression tests.
- docs requirements, plan, decisions, rollout and handoff.

## Notes / decisions

- 2026-11-02 — Owner expanded the prepared workspace into an implementation mandate. Begin with phase A; track remaining requirements without misrepresenting schema or prototypes as working journeys. Preserve the untracked audit and portrait.

- 2026-11-02 — First implementation slice and local regression evidence prepared. Required full gate:665 unit cases pass,42 skipped,3 protected-file hook failures pending human exact-path approval. Implementation is uncommitted; branch scaffold only is pushed. No production changes or readiness claim. See handoff for next steps.

- 2026-11-03 — Human seven-path source record verified unchanged. Canonical gate passes:682 unit/697 browser cases,42/147 conditional skips, with build/lint/types/format passing. Old-Git guards and explicit unapproved-write rejection remain active. Original base2f066eb; draft integration is blocked by newer develop0006–0011 and overlapping RSVP work. Hosted legacy execution, real-data deletion and token reissue remain unauthorized; see handoff.

## Activity log

- 2026-11-02 — new → todo — ihemegodsfavour8-lang (codex)
- 2026-11-02 — todo → claimed — ihemegodsfavour8-lang (codex)
- 2026-11-02 — todo → in_progress — ihemegodsfavour8-lang (codex)
- 2026-11-02 — in_progress → blocked — ihemegodsfavour8-lang (codex) — Human must create .harness/approved-writes.json for the seven generated migration files; full gate has three protected-file hook failures. Local implementation preserved; no production operation authorized.
- 2026-11-03 — blocked → in_progress — ihemegodsfavour8-lang (codex)
- 2026-11-03 — in_progress → in_review — ihemegodsfavour8-lang (codex)
