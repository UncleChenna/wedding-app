---
id: TICKET-231
title: Recover retained offline admissions through reviewed admin imports
epic: checkin
status: in_review
priority: high
estimate: L
labels: [backend, security, test]
module: checkin
owner: divine
agent: codex
blocked_by: [TICKET-184, TICKET-173, TICKET-174]
blocks: [TICKET-154]
branch: TICKET-231
pr: https://github.com/UncleChenna/wedding-app/pull/175
created: 2026-11-12
updated: 2026-11-13
started: 2026-11-13
completed: ""
reason: ""
resume_to: ""
---

# TICKET-231: Recover retained offline admissions through reviewed admin imports

## Context

TICKET-184 retains original pending admission evidence when a scanner session expires. Ordinary staff sync correctly stops accepting expired credentials. A reviewed recovery path is needed before release so retained evidence can be reconciled without extending staff credentials. See [PRD gate check-in](../docs/prd.md#gate-check-in) and [PWA storage contract](../docs/pwa.md).

## Scope

- Export minimal retained admission records with original UUIDs and device/actor provenance after normal scanner authority expires.
- Add an authenticated admin recovery review/import journey linked from the admission log, including a safe return path and clear accepted/rejected results.
- Reuse immutable admission reconciliation and persist exact acknowledgements before any local evidence removal.

## Out of scope

- Extending expired staff sessions, restoring revoked device authority, or admitting guests offline after authority expires.
- Recovering records after the browser has deleted every local copy; pretending missing evidence was acknowledged.

## Acceptance criteria

- [x] Expired-session devices can export retained original records without gaining admission or ordinary sync authority; exports contain no invitation links, signing keys or dietary notes.
- [x] A current authorized admin explicitly reviews bounded, validated imported records and their original provenance before reconciliation; unauthorized or malformed imports cannot write admission evidence.
- [x] Duplicate imports preserve original UUIDs and yield the same server acknowledgement without double-counting admissions; conflicting UUID payloads are rejected and auditable.
- [x] Pending local evidence is cleared only after matching durable server acknowledgements or an explicitly audited administrative recovery disposition; interrupted imports and rejected rows remain recoverable.
- [x] The admin log links to recovery, reports per-record outcomes and returns to the log; docs describe export/import steps, evidence limitations and incident escalation.
- [x] TICKET-154 cannot complete until this recovery path and its automated expired-session regression pass.

## Test plan

- Unit: strict payload bounds, forbidden fields, admin authorization, duplicate/conflicting UUIDs and acknowledgement matching.
- Database: repeated import idempotency, immutable provenance and audit evidence, rollback on partial failure.
- Browser: create offline attempts, expire staff authority, export, review as admin, import twice and reconcile exact acknowledgements; interrupt and resume without losing pending records.
- Manual release QA: repeat export/import on the supported physical scanner devices.

## Files likely touched

- `src/modules/checkin/`, `src/modules/admin/`, relevant admin routes and journey registry.
- `docs/pwa.md`, `docs/journeys.md`, admission recovery tests.

## Notes / decisions

- 2026-11-12 — Release-blocking follow-up to TICKET-184. Retention alone is not a working post-event recovery path; credentials remain bounded and no implementation is claimed here.

- 2026-11-13 — Implemented reviewed recovery with bounded original evidence, transactional append-only audits and signed exact receipts. Seven focused units, fifteen scan-sync database tests and two authenticated production-browser journeys pass. Two local synthetic seed runs have matching counts. All four palettes checked at 375px plus 768/1280 screenshots; physical device transfer remains TICKET-201/TICKET-138 release QA. See `docs/plans/TICKET-231-pr.md` and `docs/pwa.md` for rollout and limitations.

## Activity log

- 2026-11-12 — new → backlog — divine
- 2026-11-13 — backlog → todo — divine (codex)
- 2026-11-13 — todo → claimed — divine (codex) — started ahead of TICKET-184 (in_review)
- 2026-11-13 — todo → in_progress — divine (codex) — started ahead of TICKET-184 (in_review)
- 2026-11-13 — in_progress → in_review — divine (codex)
