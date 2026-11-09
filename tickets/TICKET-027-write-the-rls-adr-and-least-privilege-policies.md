---
id: TICKET-027
title: Write the RLS ADR and least-privilege policies
epic: data-auth
status: in_review
priority: urgent
estimate: M
labels: [security, db]
module: shared
owner: unclechenna
agent: claude
blocked_by: [TICKET-024, TICKET-025, TICKET-171, TICKET-172, TICKET-031]
blocks: [TICKET-033, TICKET-128, TICKET-176]
branch: TICKET-027
pr: https://github.com/UncleChenna/wedding-app/pull/117
created: 2026-10-21
updated: 2026-11-09
started: 2026-11-09
completed: ""
reason: ""
resume_to: ""
---

# TICKET-027: Write the RLS ADR and least-privilege policies

## Context

RLS is on with no policies. Realtime for boards and scanners needs narrow read policies; everything else stays server-only. Policy changes need an ADR and owner sign-off.

See: [Security](../docs/prd.md#security) · [Privacy (UK GDPR)](../docs/prd.md#privacy-uk-gdpr).

## Scope

- ADR listing every table and who may read/write it.
- Policies for realtime channels only (staff session claims).
- Automated test that the anon key can read nothing else.

## Out of scope

- Realtime wiring (TICKET-033).

## Acceptance criteria

- [x] ADR approved by an owner in the PR review.
- [x] Tests: anon/publishable key gets zero rows from every table; staff claim reads only permitted columns.
- [x] Dietary notes are not readable through any browser policy except kitchen staff.

- [x] RLS and Realtime grants must enforce role access, while server projections omit private columns. Gate/bar/anonymous queries and subscriptions never return dietary notes or other households.

## Test plan

- Unit: Policy tests against the local stack.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Integration: exercise each role with direct queries, joins, subscriptions and guessed identifiers; ensure no bypass through a generic endpoint.

## Files likely touched

- `drizzle/`
- `docs/decisions/`
- `src/modules/shared/server/db/`

## Notes / decisions

_Agents append dated notes here while working._

- 2026-11-09 (unclechenna, claude):
  - **Design:** no browser policy on any table; one receive-only Broadcast policy per station channel (ADR 0023).
    Staff can therefore read no table columns at all, which is stricter than "only permitted columns".
  - **Owner approval:** asked directly on 2026-11-09 whether they approve ADR 0023, the owner (UncleChenna) answered "i approve, merge all the prs". ADR 0023 is now Accepted.
  - **Server projections:** no browser-visible payload exists yet, so nothing can leak private columns today. The
    payloads arrive in TICKET-033, which must show that gate, bar and anonymous subscribers never receive dietary
    notes or other households (TICKET-128 publishes the field contract). The RLS and Realtime half is tested here.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-09 — todo → claimed — unclechenna (claude)
- 2026-11-09 — todo → in_progress — unclechenna (claude)
- 2026-11-09 — in_progress → in_review — unclechenna (claude)
