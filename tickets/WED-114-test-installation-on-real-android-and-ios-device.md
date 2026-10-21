---
id: WED-114
title: Test installation on real Android and iOS devices
epic: pwa
status: todo
priority: high
estimate: S
labels: [human, pwa, test]
module: ops
owner: ""
agent: ""
blocked_by: [WED-113, WED-154]
blocks: [WED-163]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-114: Test installation on real Android and iOS devices

## Context

Emulation does not prove install, icons, splash screens or offline behaviour on real phones.

See: [Usability and accessibility](../docs/prd.md#usability-and-accessibility) · [What "flawless" means in testing](../docs/prd.md#what-flawless-means-in-testing).

## Scope

- Install from the production URL on one iPhone and one Android; check icon, splash, offline pass and scanner.

## Out of scope

- Automated tests.

## Acceptance criteria

- [ ] Device models, OS versions and results recorded in notes with screenshots.
- [ ] Any failure has a linked fix-up ticket.

## Test plan

- Manual: Real devices.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `docs/runbook.md`

## Notes / decisions

- 2026-10-21: Needs a person (decision, account or physical task). Agents may prepare docs and record the outcome.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
