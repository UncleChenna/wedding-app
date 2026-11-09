---
id: TICKET-128
title: Restrict dietary notes to admin and kitchen
epic: security
status: blocked
priority: urgent
estimate: S
labels: [security, backend]
module: shared
owner: divine
agent: codex
blocked_by: [TICKET-027]
blocks: [TICKET-076, TICKET-129, TICKET-176]
branch: TICKET-128
pr: ""
created: 2026-10-21
updated: 2026-11-09
started: 2026-11-09
completed: ""
reason: "Draft PR #133 https://github.com/UncleChenna/wedding-app/pull/133: independent review clean; waiting for TICKET-027 policy integration and final CI. Local projection checks pass; no RLS integration claimed."
resume_to: in_progress
---

# TICKET-128: Restrict dietary notes to admin and kitchen

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

- [x] Publish an executable role/field projection contract early: only admin/kitchen receive dietary information. Every later query, subscription and export must reuse or test this contract.

## Test plan

- Unit: Role projection tests.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Unit/integration: gate/bar/anonymous projections omit sensitive fields, including nested JSON and free-text notes.

## Files likely touched

- `src/modules/*/server/`

## Notes / decisions

_Agents append dated notes here while working._

- 2026-11-09 — Started ahead of TICKET-027 using its proposed ADR 0023 contract; no policy or migration edits. Shared allowlisted role projections now back gate printing and station alert formatting. Private RSVP dietary/history/import fields are distinct from the existing deliberately submitted kitchen/bar order instruction; operational notes and existing queued alerts are preserved. See docs/dietary-privacy.md for consumer inventory and future requirements. Focused projection/reader/response tests: 44 passed; verify:quick lint/types passed and 45 related tests passed (29 DB tests skipped). No new database run or RLS integration is claimed. First criterion remains open pending TICKET-027 integration and final review; future bar/kitchen board endpoints do not yet exist.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-09 — todo → claimed — divine (codex) — started ahead of TICKET-027 (in_progress)
- 2026-11-09 — todo → in_progress — divine (codex) — started ahead of TICKET-027 (in_progress)
- 2026-11-09 — in_progress → blocked — divine (codex) — Draft PR #133 https://github.com/UncleChenna/wedding-app/pull/133: independent review clean; waiting for TICKET-027 policy integration and final CI. Local projection checks pass; no RLS integration claimed.
