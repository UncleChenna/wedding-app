---
id: WED-118
title: Audit staff and admin screens for accessibility and legibility
epic: quality
status: todo
priority: medium
estimate: L
labels: [frontend, test]
module: admin
owner: ""
agent: ""
blocked_by: [WED-060, WED-078, WED-093, WED-115]
blocks: []
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-118: Audit staff and admin screens for accessibility and legibility

## Context

Scanner results and boards must be readable at arm's length; admin screens must be keyboard-operable.

See: [Usability and accessibility](../docs/prd.md#usability-and-accessibility) · [Design principles (repo)](../docs/design-principles.md).

## Scope

- Arm's-length check, status meanings in every theme, keyboard paths for admin.

## Out of scope

- Guest pages.

## Acceptance criteria

- [ ] Audit report in docs/audits/; no open serious finding.
- [ ] Staff text ≥18px and identifiers ≥32px verified in every theme.

## Test plan

- Manual: Arm's-length reading test.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `docs/audits/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
