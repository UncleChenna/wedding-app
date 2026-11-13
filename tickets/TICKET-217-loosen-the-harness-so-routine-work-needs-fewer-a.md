---
id: TICKET-217
title: Loosen the harness so routine work needs fewer approvals
epic: foundations
status: done
priority: high
estimate: M
labels: [infra, docs]
module: harness
owner: unclechenna
agent: claude
blocked_by: []
blocks: []
branch: TICKET-217
pr: https://github.com/UncleChenna/wedding-app/pull/108
created: 2026-11-06
updated: 2026-11-06
started: 2026-11-06
completed: ""
reason: ""
resume_to: ""
---

# TICKET-217: Loosen the harness so routine work needs fewer approvals

## Context

The owner asked on 2026-11-06 to make the process lighter. In one session, an approved, generated, additive migration
(TICKET-084) blocked the agent for hours. The cause was the exact-path approval file plus a stop hook that kept failing.
Routine shell commands were also refused, and the full verify ran twice (locally and in CI) for every PR.

See: [Collaboration](../docs/collaboration.md) · [Tickets](../docs/tickets.md).

## Scope

1. **Migrations:** new files from `pnpm db:generate` (new `drizzle/NNNN_*.sql` and snapshots, plus `_journal.json`
   entries that only add) need no approval file. Editing or deleting an already-committed migration or snapshot stays
   protected. SQL that drops a table or column, changes a column's type, or deletes or truncates data is flagged for
   owner sign-off.
2. **Stop hook:** a protected file awaiting approval is reported, not a failing stop.
3. **Approvals:** the owner's sign-off in the conversation, recorded in the PR body, is enough. The approval file stays
   as an option, and an agent may write it when the owner explicitly tells it to.
4. **Shell hooks:** redirects to `/dev/null`, heredocs and writes to the session scratchpad and `/tmp` are allowed.
   Secret files, lockfiles, `.git` and edits to applied migrations stay blocked.
5. **`t:pr`:** runs `verify:quick` locally. CI's `pnpm verify` stays the full merge gate. `--full` runs the full suite
   locally.
6. **Merging:** the ticket owner's agent may merge its own PR once every required CI check is green, unless the owner
   asks to review first. `develop` and `main` still take no direct pushes.
7. **Paperwork:** the PR description is the single write-up. A handoff file is needed only for unfinished or handed-over
   work, and plan and review files are optional.
8. **UI checklist:** full evidence for guest-facing pages; for admin and staff screens, one theme at 375px plus axe,
   with contrast checked in every theme.
9. **Light lane:** small fixes (about 50 changed lines, no schema, RLS, CI or dependency change) may skip the ticket
   file. They use a `chore/<slug>` branch, a Conventional Commit and a PR to `develop`.

## Out of scope

- Replacing per-worktree Docker databases: TICKET-213 (production database host / Neon).
- Branch protection and CODEOWNERS: TICKET-005.

## Acceptance criteria

- [x] New generated migration files pass the hooks; editing an already-committed one is still refused (hook tests).
- [x] Destructive migration SQL is detected (unit test).
- [x] The stop hook no longer fails on files awaiting approval (hook test).
- [x] `2>/dev/null`, heredocs and scratchpad writes are allowed; `.env` and lockfile writes are still refused (hook tests).
- [x] `t:pr` runs `verify:quick` by default and the full verify with `--full`.
- [x] AGENTS.md, collaboration, tickets and UI-checklist docs and the ticket-workflow skill describe the new rules.

## Test plan

- Unit: harness hook tests in `scripts/__tests__`.
- Gate: `pnpm verify` passes.

## Files likely touched

- `scripts/harness/hooks.mjs`, `scripts/harness/core.mjs`
- `scripts/tickets*.ts` (`t:pr`)
- `AGENTS.md`, `CLAUDE.md`, `docs/collaboration.md`, `docs/tickets.md`, `docs/ui-checklist.md`, `docs/engineering.md`
- `.agents/skills/ticket-workflow/SKILL.md`, `.agents/skills/db-migration/SKILL.md`

## Notes / decisions

_Agents append dated notes here while working._

- 2026-11-06 (unclechenna, claude): the owner approved the change.
  - **Migrations:** compared against the merge-base with `origin/develop`, so a migration generated and regenerated on
    a branch stays free until it merges.
  - **Destructive SQL:** dropping an index or constraint isn't flagged, since it loses no data.
  - **Also fixed:** `t:pr` now readies an existing draft PR, because PR #91 stayed a draft after `t:pr`.
  - **Out of scope:** replacing per-worktree Docker databases (TICKET-213).

## Activity log

- 2026-11-06 — new → backlog — unclechenna
- 2026-11-06 — backlog → todo — unclechenna
- 2026-11-06 — todo → claimed — unclechenna (claude)
- 2026-11-06 — todo → in_progress — unclechenna (claude)
- 2026-11-06 — in_progress → in_review — unclechenna (claude)
