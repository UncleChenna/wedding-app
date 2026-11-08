# Ticket

Ticket: TICKET-214

# Summary

The owner asked for the ticket rules to be less strict, so that one person can keep working while another's ticket is
still in flight. Two rules got in the way:

1. **Contiguous ids.** `t:validate`, which runs in the commit hook and CI, failed whenever a lower id had no file.
   TICKET-211 and TICKET-212 are reserved by another collaborator but not pushed, so nobody could commit TICKET-213 or
   later.
2. **Done dependencies.** `t:claim` and `t:move … in_progress` refused until every `blocked_by` ticket was `done`, even
   when its PR was merged or in review.

Now:

- A gap is fine when the shared ledger reserved that id and its file isn't on `develop` yet.
- `--ahead` starts a ticket while its blockers are in progress, in review or blocked.
- `done` still waits for every blocker.

# Changes

- **`scripts/tickets/validate.ts`:** `validateTickets(tickets, { reserved })` skips reserved ids in the contiguity
  check.
- **`scripts/tickets.ts`:**
  - `reservedIds()` returns ledger-allocated ids that aren't on `origin/develop`, or `undefined` (strict) if the ledger
    is unavailable
  - `--ahead` is passed through to claim and move
  - `aheadNote()` records "started ahead of TICKET-X (in_review)" in the activity log
- **`scripts/tickets/workflow.ts`:**
  - `checkBlockers()` is shared by claim and the move to in progress
  - the refusal without `--ahead` is unchanged apart from an added hint
  - `--ahead` requires every unfinished blocker to be actively owned
  - `done` now requires every blocker done
- **`scripts/__tests__/tickets.test.ts`:** 6 new tests.
- **Docs:** `docs/tickets.md` (transition and command tables, plus a new "Working ahead of other people's tickets"
  section) and the `ticket-workflow` skill.
- Carries the definition of TICKET-213 (mine; draft PR #93), which couldn't be committed before this change.

# Acceptance criteria and evidence

- [x] **A ledger-reserved gap is accepted and an unreserved one is still reported.** Unit test. Live: this checkout,
      with TICKET-211 and 212 only reserved, gives `✔ 212 tickets valid`, and so did the commit hook.
- [x] **`--ahead` claims past in-progress, in-review or blocked blockers and refuses an unowned todo.** Unit tests.
- [x] **Refusals without `--ahead` are unchanged and mention the flag.** Unit test. The existing claim and move tests
      still pass.
- [x] **`done` refuses while a blocker is unfinished.** Unit test.
- [x] **Docs describe the flag, its limits and the merge-order expectation.** `docs/tickets.md` and the skill.

# Verification

- `vitest run scripts/__tests__/tickets.test.ts`: 34 passed.
- `pnpm typecheck`, ESLint and Prettier: clean. `pnpm t:validate`: 212 tickets valid.
- Full `pnpm verify`: run by `pnpm t:pr`; see CI.

# Risks and rollout

- No app code, schema, CI or RLS changes. Behaviour without `--ahead` is unchanged, apart from `done` now checking
  blockers, which matches the rule already documented.
- CI's ticket job reads the ledger in `origin` mode. If it can't, validation stays strict.
- **Other collaborators' checkouts** keep the old rules until they update to this `develop`. Codex and the third
  collaborator should be told.
- To roll back, revert this PR.

# Screenshots / UI checklist

N/A: tooling only.

# Harness changes, if any

Yes, described above.
