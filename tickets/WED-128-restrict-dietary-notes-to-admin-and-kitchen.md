---
id: WED-128
title: Restrict dietary notes to admin and kitchen
epic: security
status: todo
priority: urgent
estimate: S
labels: [security, backend]
module: shared
owner: ""
agent: ""
blocked_by: [WED-027]
blocks: [WED-076, WED-129, WED-176]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-128: Restrict dietary notes to admin and kitchen

## Context

Dietary notes (health data) are visible to admin and kitchen only.

See: [Privacy (UK GDPR)](../docs/prd.md#privacy-uk-gdpr).

## Scope

- Server queries for gate and bar never select dietary notes.
- Test per role.

## Out of scope

- Encryption at rest beyond Supabase defaults.

## Acceptance criteria

- [ ] Gate and bar responses contain no dietary fields (test per endpoint).

- [ ] Publish an executable role/field projection contract early: only admin/kitchen receive dietary information. Every later query, subscription and export must reuse or test this contract.

## Test plan

- Unit: Role projection tests.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Unit/integration: gate/bar/anonymous projections omit sensitive fields, including nested JSON and free-text notes.

## Files likely touched

- `src/modules/*/server/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
