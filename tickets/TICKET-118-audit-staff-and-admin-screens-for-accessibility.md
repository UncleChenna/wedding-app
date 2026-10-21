---
id: TICKET-118
title: Audit staff and admin screens for accessibility and legibility
epic: quality
status: todo
priority: medium
estimate: L
labels: [frontend, test, human]
module: admin
owner: ""
agent: ""
blocked_by: [TICKET-060, TICKET-078, TICKET-093, TICKET-115]
blocks: [TICKET-154, TICKET-164]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-118: Audit staff and admin screens for accessibility and legibility

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

- [ ] Scope this review to the stated devices/journeys and bounded fixes; split larger remediation through t:new and block release on those tickets instead of accepting failed device evidence.

## Test plan

- Manual: Arm's-length reading test.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Manual: record device/browser/version, screenshots, failures, linked fixes and successful retests.

## Files likely touched

- `docs/audits/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
