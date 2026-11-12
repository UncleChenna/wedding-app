---
id: TICKET-228
title: Merge unstarted overlapping tickets to cut per-ticket overhead
epic: foundations
status: in_progress
priority: medium
estimate: M
labels: [docs]
module: harness
owner: unclechenna
agent: claude
blocked_by: []
blocks: []
branch: TICKET-228
pr: ""
created: 2026-11-12
updated: 2026-11-12
started: 2026-11-12
completed: ""
reason: ""
resume_to: ""
---

# TICKET-228: Merge unstarted overlapping tickets to cut per-ticket overhead

## Context

Every ticket costs a worktree, a database stack, a production build, browser tests, a PR and a ~20-minute CI run,
whatever its size. The owner asked (2026-11-12) to fold together tickets that haven't started, so the remaining
work moves faster without changing what gets built. Rules: [tickets](../docs/tickets.md).

## Scope

- Merge 17 unstarted, unclaimed tickets into 11 survivors that cover the same flow:
  - 085 ← 087 (alert sending and its board health)
  - 111 ← 180 (app updates and queued data across upgrades)
  - 116 ← 121 (guest page performance and layout-shift gates)
  - 014 ← 038, 119 (theme, hero photo, image optimisation)
  - 126 ← 127 (privacy notice and retention job)
  - 129 ← 124 (security review and headers)
  - 149 ← 213 (preview/staging and worktree databases)
  - 150 ← 152 (migrations and smoke tests in the deploy pipeline)
  - 132 ← 136 (gate journey online and offline)
  - 145 ← 144, 146, 147, 148 (production platform setup)
  - 114 ← 138, 201, 206 (one real-device test session)
- Survivors get each absorbed ticket's scope, acceptance criteria (tagged "from TICKET-x"), test plan and
  dependencies, and size L. Absorbed tickets are cancelled with the reason "Merged into TICKET-x".
- Unstarted tickets that depended on an absorbed ticket now depend on its survivor.

## Out of scope

- Started, claimed or finished tickets, including Codex's in-flight gate work (063, 065, 068, 081, 174): their
  files aren't edited. A cancelled id left in their `blocks` list is cosmetic.
- Merges that would exceed size L (117+118, 151+179+153) or join different timelines (157+177).

## Acceptance criteria

- [x] Each of the 17 absorbed tickets is `cancelled` with a "Merged into" reason, and its criteria appear in the survivor.
- [x] No unstarted ticket is blocked by a cancelled ticket (checked with grep), and `pnpm t:validate` passes.
- [x] No started, claimed or finished ticket file is changed (only todo, backlog and cancelled files in the diff).

## Test plan

- Unit: `pnpm t:validate` over all tickets.
- Manual: grep for unstarted tickets blocked by a cancelled id; diff limited to todo/backlog/cancelled files.

## Files likely touched

- `tickets/TICKET-*.md` (47 files)

## Notes / decisions

- 2026-11-12 (unclechenna, claude): applied with a one-off script (survivor gets scope, criteria, test plan and
  merged dependencies; absorbed tickets cancelled; dependents repointed). Edits to in-flight tickets owned by
  others were reverted before commit.

## Activity log

- 2026-11-12 — new → backlog — unclechenna
- 2026-11-12 — backlog → todo — unclechenna (claude)
- 2026-11-12 — todo → claimed — unclechenna (claude)
- 2026-11-12 — todo → in_progress — unclechenna (claude)
