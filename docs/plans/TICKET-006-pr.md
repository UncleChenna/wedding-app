# TICKET-006: managed worktree lifecycle rehearsal

The rehearsal now proves that two worktrees can build and run browser smoke suites concurrently on distinct ports. It also exposed a database-target mismatch after failed managed startup, so this PR remains draft.

## Changes

- Correct collaboration documentation to use exact ticket-ID branch names and sync completion only on the relevant ticket branch.
- Preserve dated setup, browser, migration and cleanup evidence and exact resume instructions.

## Validation

- TICKET-006 build passed; concurrent browser suite: 155 passed, 17 conditional skips.
- Completed TICKET-195 control build passed; concurrent browser suite: 167 passed, 17 conditional skips.
- Browser ports were 34811 and 39291. Both suites exited0 with no retries.
- TICKET-006 managed startup and baseline migration passed.
- The control startup eventually failed. Its effective database URL still targeted primary local port54322 rather than reserved39281. Its migration command reported already-applied migrations; this invalidates the claimed concurrent isolated migration proof.
- No seed, reset, marker write or successful cleanup was performed. Full lifecycle and full verification remain incomplete.

## Remaining work and risks

TICKET-205 tracks validation of database target identity before migration, seed and checks connect. Complete that safeguard, restore full control startup, then repeat migrations/isolation and cleanup tests before this PR is ready. Do not merge this draft or mark TICKET-006 complete.

Review docs/reviews/TICKET-006/README.md and docs/handoffs/TICKET-006.md. Reverting these documentation changes needs no database rollback.
