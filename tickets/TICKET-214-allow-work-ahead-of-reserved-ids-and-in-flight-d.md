---
id: TICKET-214
title: Allow work ahead of reserved ids and in-flight dependencies
epic: foundations
status: in_review
priority: urgent
estimate: S
labels: [infra, docs]
module: harness
owner: unclechenna
agent: claude
blocked_by: []
blocks: []
branch: TICKET-214
pr: https://github.com/UncleChenna/wedding-app/pull/94
created: 2026-11-04
updated: 2026-11-04
started: 2026-11-04
completed: ""
reason: ""
resume_to: ""
---

# TICKET-214: Allow work ahead of reserved ids and in-flight dependencies

## Context

Three collaborators now share the backlog ([collaboration](../docs/collaboration.md), [tickets](../docs/tickets.md)).
Two rules stop one person working while another's ticket is in flight:

- **Contiguous ids.** `t:validate`, which also runs in the commit hook and CI, fails while any lower id has no ticket
  file. TICKET-211 and TICKET-212 are reserved in the ledger by another collaborator, so no one can commit TICKET-213
  or later until that person pushes their files.
- **Done dependencies.** `t:claim` and `t:move … in_progress` refuse while any `blocked_by` ticket isn't done, even
  when its PR is merged and only the owner's `t:move done` is missing, or it's actively in review.

The owner asked for these to be less strict.

## Scope

- `t:validate` treats an id as present when the shared ledger has reserved it, so gaps owned by other collaborators no
  longer fail. If the ledger is unavailable, the current strict check still applies. Deleting a committed ticket is
  still caught.
- `t:claim <id> --ahead` and `t:move <id> in_progress --ahead` allow starting while dependencies are unfinished, if
  every unfinished dependency is actively owned (`in_progress`, `in_review` or `blocked`). Unowned `todo` dependencies
  still refuse. The log line records which dependencies were outstanding.
- Kept strict: `t:move <id> done` requires every `blocked_by` ticket done.
- Document the flag and the rule in `docs/tickets.md` and the `ticket-workflow` skill.

## Out of scope

- Renaming ledger keys from `WED-` (separate follow-up).
- Merge ordering on GitHub; a reviewer still merges dependencies first.

## Acceptance criteria

- [x] `validateTickets` accepts a gap for a ledger-reserved id and still reports an unreserved gap (unit).
- [x] `t:claim --ahead` succeeds when blockers are in progress or in review, and refuses when a blocker is an unowned todo (unit).
- [x] Without `--ahead`, claim and in-progress refusals are unchanged and mention the new flag (unit).
- [x] Moving to done still refuses while any blocker is unfinished (unit).
- [x] Docs describe `--ahead`, its limits and the merge-order expectation.

## Test plan

- Unit: `scripts/__tests__/tickets.test.ts` and a workflow test for claim, move and validate.
- Manual: `pnpm t:validate` passes in a checkout with TICKET-213 and TICKET-214 while TICKET-211 and TICKET-212 are only reserved.

## Files likely touched

- `scripts/tickets/validate.ts`, `scripts/tickets/workflow.ts`, `scripts/tickets.ts`
- `docs/tickets.md`, `.agents/skills/ticket-workflow/SKILL.md`

## Notes / decisions

_Agents append dated notes here while working._

- 2026-11-04:
  - **Reserved ids.** `t:validate` computes reserved ids as ledger-allocated ids (1..`lastId`) whose file is not on
    `origin/develop`. A gap for one of those is allowed; any other gap, including a ticket deleted after reaching
    develop, still fails. If the ledger can't be read, validation is strict as before. Evidence: with TICKET-213 and 214
    present and TICKET-211/212 only reserved by another collaborator, `pnpm t:validate` reports 212 tickets valid.
  - **`--ahead`.** `checkBlockers` in `workflow.ts` is shared by claim and the move to in progress. Without the flag
    the refusal is the same, plus a hint. With it, every unfinished blocker must be `in_progress`, `in_review` or
    `blocked`. The log line records "started ahead of …". `done` now also requires every blocker done.
  - **Carries TICKET-213's definition** (mine), which couldn't be committed before this change.
  - **Tests:** `scripts/__tests__/tickets.test.ts`, 34 passed (6 new).

## Activity log

- 2026-11-04 — new → todo — unclechenna
- 2026-11-04 — todo → claimed — unclechenna (claude)
- 2026-11-04 — todo → in_progress — unclechenna (claude)
- 2026-11-04 — in_progress → in_review — unclechenna (claude)
