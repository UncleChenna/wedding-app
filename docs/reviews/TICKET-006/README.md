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

## 2026-10-27 — partial recovery and verified target mismatch

TICKET-006 managed startup and baseline migration succeeded; branch start commit 9c900d5, app34810/browser34811/database34801. Control TICKET-195 remained at clean 00872cb (merged PR40), reserved app39290/browser39291/database39281.

Both builds passed. Concurrent browser smoke processes completed exit0: TICKET-006 155 passed/17 conditional skips in2.9m; control167 passed/17 skips in3.0m. No test retries. This proves browser-port separation for these older branch heads, not current develop's full gate.

Concurrent pnpm db:migrate invocations both exited0, but subsequent effective-URL and cluster-identity checks INVALIDATED the control's isolation result: TICKET-006 port34801/system_identifier7701200755950936102; control effective port54322/system_identifier7698965571021250597. Control still had a copied primary URL because db:start had not finished. Its migration output only reported existing schema/migration table and already-applied migrations; no intentional marker write, reset, seed or cleanup was performed. Never repeat database commands against this control until identity validation is installed.

Control db:start eventually exited1 with the suppressed startup-failure message. Session17781 is terminal. Docker health reads were slow; last observation showed healthy DB/auth/kong with remaining services still starting. No global Docker action taken.

TICKET-205 now tracks mandatory target validation before migrate/seed/check connections. TICKET-006 remains incomplete: concurrent correctly targeted migrations, data isolation and successful cleanup unproved. Resume after TICKET-205 and verified full control startup. No acceptance box is checked based on wrong-target evidence.
