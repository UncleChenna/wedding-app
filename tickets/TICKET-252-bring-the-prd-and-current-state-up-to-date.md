---
id: TICKET-252
title: Bring the PRD and current-state notes up to date
epic: foundations
status: done
priority: medium
estimate: S
labels: [docs]
module: shared
owner: unclechenna
agent: claude
blocked_by: []
blocks: []
branch: TICKET-252
pr: "#217"
created: 2026-11-13
updated: 2026-11-13
started: 2026-11-13
completed: 2026-11-13
reason: ""
resume_to: ""
---

# TICKET-252: Bring the PRD and current-state notes up to date

## Context

The owner asked for the PRD to be up to date. It was last amended on 2026-11-01 and didn't say what is built,
missed features added since, and still listed decided questions as open. `docs/current-state.md` still described
the 2026-10-21 placeholder app.

## Scope

- PRD: a dated build-status section, features added beyond the requirements, ORD-9 as built, the Wi-Fi on table
  cards, retention and WCAG baselines, the chosen tech, the milestone wording and the open questions.
- current-state: a dated summary at the top that marks the original audit as history.

## Out of scope

- Changing any requirement or priority; owner decisions stay open where they are open.

## Acceptance criteria

- [x] The PRD says which requirements are built and what each area still needs, with ticket numbers.
- [x] Decided questions (colours, retention) are recorded; undecided ones stay marked open.
- [x] current-state.md opens with an accurate 2026-11-13 summary.

## Test plan

- Manual: read both files; `pnpm format:check`.

## Files likely touched

- `docs/prd.md`
- `docs/current-state.md`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-11-13 — new → in_review — unclechenna (claude) — owner asked for the PRD to be up to date
