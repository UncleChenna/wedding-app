---
id: WED-027
title: Write the RLS ADR and least-privilege policies
epic: data-auth
status: todo
priority: urgent
estimate: M
labels: [security, db]
module: shared
owner: ""
agent: ""
blocked_by: [WED-024, WED-025, WED-171, WED-172, WED-031]
blocks: [WED-033, WED-128, WED-176]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-027: Write the RLS ADR and least-privilege policies

## Context

RLS is on with no policies. Realtime for boards and scanners needs narrow read policies; everything else stays server-only. Policy changes need an ADR and owner sign-off.

See: [Security](../docs/prd.md#security) · [Privacy (UK GDPR)](../docs/prd.md#privacy-uk-gdpr).

## Scope

- ADR listing every table and who may read/write it.
- Policies for realtime channels only (staff session claims).
- Automated test that the anon key can read nothing else.

## Out of scope

- Realtime wiring (WED-033).

## Acceptance criteria

- [ ] ADR approved by an owner in the PR review.
- [ ] Tests: anon/publishable key gets zero rows from every table; staff claim reads only permitted columns.
- [ ] Dietary notes are not readable through any browser policy except kitchen staff.

- [ ] RLS and Realtime grants must enforce role access, while server projections omit private columns. Gate/bar/anonymous queries and subscriptions never return dietary notes or other households.

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

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
