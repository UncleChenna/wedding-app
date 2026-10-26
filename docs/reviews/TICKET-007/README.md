# TICKET-007 real GitHub claim-race evidence

26 October 2026. Two separate clones, one operator, distinct harness.owner values rehearsal-a and rehearsal-b. Both used the actual https://github.com/UncleChenna/wedding-app.git origin and current CLI. No ledger algorithm changes.

Started: 2026-10-26T17:52:15.339247+00:00. Finished: 2026-10-26T17:52:37.152099+00:00.

Probe: TICKET-005 was confirmed todo and unowned before the race. Its prerequisites were satisfied. No CODEOWNERS, branch protection, product code or status transition was performed on the probe.

## Claim outputs

### Clone a — exit 0

```text
Recorded in the shared ledger. TICKET-005's file is updated when you run t:move in its worktree (this checkout is on TICKET-007).
Claimed TICKET-005 for rehearsal-a (codex). Branch: TICKET-005
Next: pnpm wt:new TICKET-005
$ tsx scripts/tickets.ts claim TICKET-005 --owner rehearsal-a --agent codex
```

### Clone b — exit 1

```text
$ tsx scripts/tickets.ts claim TICKET-005 --owner rehearsal-b --agent codex
✖ TICKET-005 is already claimed by rehearsal-a.
[ELIFECYCLE] Command failed with exit code 1.
```

## Cross-clone visibility

The losing clone read owner `rehearsal-a`, agent `codex`, status `todo` through `pnpm -s t:show TICKET-005 --json`.

Its `pnpm -s t:next --human --json` returned:

```json
{
  "id": "TICKET-034",
  "title": "Decide wedding date, RSVP lock, tag-along limit and Wallet scope",
  "epic": "invitations",
  "status": "todo",
  "priority": "urgent",
  "estimate": "S",
  "labels": ["human", "docs"],
  "module": "invitations",
  "owner": "",
  "agent": "",
  "blocked_by": [],
  "blocks": ["TICKET-023", "TICKET-042", "TICKET-096", "TICKET-101", "TICKET-176", "TICKET-177"],
  "branch": "",
  "pr": "",
  "created": "2026-10-21",
  "updated": "2026-10-21",
  "started": "",
  "completed": "",
  "reason": "",
  "resume_to": ""
}
```

The live board included this line:

```text
TICKET-005 Repl… @rehearsal-a │ TICKET-007 Prove tic… @divine │ TICKET-106 Add … @unclechenna │ TICKET-006 Prove the… @divine │ … 13 earlier
```

After `git fetch origin ticket-ledger`, the GitHub commit was:

```text
2b996fed58f3e6f710e34f485e8e8fe7c889b41c TICKET-005: 2026-10-26 — todo → claimed — rehearsal-a (codex)
```

## Restoration

The winner ran `pnpm t:release TICKET-005 --owner rehearsal-a --reason "TICKET-007 claim-race rehearsal complete"` (exit 0). Final live read: status `todo`, owner empty, branch ``. No probe worktree or feature branch was created. The claim/release audit history remains in the shared ledger.

## Limits

This proves two independent clones contend correctly against real GitHub, not two-human ergonomics or database isolation. TICKET-006 remains blocked on local Docker startup health. This rehearsal did not need a database; its optional managed startup was cancelled and is not claimed ready. Test clone output stays ignored under .harness/claim-race. The user subsequently authorized resuming TICKET-015 and selected the warm invitation voice.
