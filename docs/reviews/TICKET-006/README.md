# TICKET-006 lifecycle rehearsal — blocked

26 October 2026. No full lifecycle success is claimed.

| Observation                       | Evidence                                                                                                                                                                |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Claim and worktree creation       | CLI claimed TICKET-006 for divine/codex; branch created from develop 9cbc1ec.                                                                                           |
| Isolated reservation              | TICKET-006: project wedding-60a4460888c0, base 34800, app 34810, browser 34811. Control TICKET-192: project wedding-b67c568149ae, base 34320, app 34330, browser 34331. |
| Setup                             | Locked dependency install and agents:link passed. Supabase startup did not become ready.                                                                                |
| Database health                   | New local Postgres container reported unhealthy, failing streak 3. Health output: `127.0.0.1:5432 - no response`, followed by timed-out health-check starts.            |
| Build                             | `pnpm build` in TICKET-006 passed; this does not prove database readiness.                                                                                              |
| Cleanup attempts                  | Both attempts while setup was running were refused by the active harness-worktrees lock. These do NOT establish dirty/unmerged cleanup protection.                      |
| Concurrent migration/smoke        | NOT RUN: new database unhealthy.                                                                                                                                        |
| Data isolation and merged cleanup | NOT RUN. No rehearsal marker rows were created and no worktree/database was removed.                                                                                    |

Requested SIGINT only for this rehearsal's Supabase start process. It exited with the managed startup-failed message and released its lock. Subsequent `wt:remove TICKET-006` refused with "Worktree has changes"; `wt:remove TICKET-192` refused at the ancestry check (`git merge-base --is-ancestor HEAD FETCH_HEAD`). Both checkouts were retained. Quick verification passed (lint, types, no changed source tests). Other existing Docker stacks were left untouched. Resume only after verifying the startup process has ended and the managed lock is released; never remove a live process's lock.

## Resume

1. Restore sufficient local Docker health/capacity and rerun `AGENT_OWNER=divine pnpm wt:new TICKET-006` from the primary checkout.
2. Follow docs/plans/2026-10-26-TICKET-006.md, verifying both stack identities before data operations.
3. Record concurrent migration and smoke commands with exit codes/timestamps, dirty and unmerged refusals, then successful cleanup of only the disposable control checkout.
4. Prove the surviving stack still responds; run full verification before moving to review/completion.

Corrected two documentation inaccuracies found during inspection: exact ticket-ID branch names and per-ticket-branch status syncing. No harness feature changes or checks weakened.

## 2026-10-26 — recovery attempt after TICKET-195 merged

Retried managed setup for TICKET-006 after a separate stack recovered. Its Postgres container became healthy, but studio, pg_meta and storage reported unhealthy and setup exited 1. A completed, clean TICKET-195 checkout was selected as control: its HEAD and origin branch were both 00872cb, and its tree matched merged commit ea5e2fa exactly. The control's isolated Postgres reported unhealthy. Requested SIGINT only for that control startup after the TICKET-006 attempt had failed; no Docker restart or unrelated container action was taken. No migration, browser race, marker write or successful cleanup is claimed. Ticket remains blocked; PR #34 remains draft.
