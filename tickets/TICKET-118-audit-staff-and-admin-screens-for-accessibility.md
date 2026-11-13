---
id: TICKET-118
title: Audit staff and admin screens for accessibility and legibility
epic: quality
status: in_progress
priority: medium
estimate: L
labels: [frontend, test, human]
module: admin
owner: divine
agent: codex
blocked_by: [TICKET-060, TICKET-078, TICKET-093, TICKET-115]
blocks: [TICKET-154, TICKET-164]
branch: TICKET-118
pr: ""
created: 2026-10-21
updated: 2026-11-13
started: 2026-11-13
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

- [x] Audit report in docs/audits/; no open serious finding.
- [x] Staff text ≥18px and identifiers ≥32px verified in every theme.

- [x] Scope this review to the stated devices/journeys and bounded fixes; split larger remediation through t:new and block release on those tickets instead of accepting failed device evidence.

## Test plan

- Manual: Arm's-length reading test.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Manual: record device/browser/version, screenshots, failures, linked fixes and successful retests.

## Files likely touched

- `docs/audits/`

## Notes / decisions

2026-11-13: 88 all-theme automated states pass axe, overflow and 18px/32px legibility thresholds. Real PIN/TOTP, camera verdict and modal/settings keyboard paths pass. Physical reading/device checks remain release-blocking in TICKET-201 under standing owner authorization; separate slow-read race reserved as TICKET-238. See docs/audits/TICKET-118-staff-admin-accessibility.md.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-13 — todo → claimed — divine (codex)
- 2026-11-13 — todo → in_progress — divine (codex)
