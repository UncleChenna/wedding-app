# TICKET-181 integration proposal — 2026-11-07

Approval requested, not executed. Target develop commit
`205cc66350864c0a4f57c392db7b663ff20bf25c`.

The merge preview conflicts in `drizzle/meta/0013_snapshot.json` and
`drizzle/meta/_journal.json`. Develop owns migration 0013 (outbox) and 0014
(photos). This branch owns a different 0013, now applied only to its isolated
local database. Source schema merges automatically; review both additions.

## Proposed operations

1. Commit and push current verification evidence, then merge the pinned develop
   commit into TICKET-181. Preserve develop migrations byte-for-byte.
2. Remove only this branch's `drizzle/0013_theme-published-tokens.sql`, restore
   develop's snapshots/journal, and run the Drizzle generator with the name
   `theme-published-tokens`. Expected new SQL is exactly the existing additive
   `ALTER TABLE "themes" ADD COLUMN "published_tokens" jsonb;`, numbered 0015.
   Inspect the generated diff before applying; stop if any other schema change appears.
3. Record actual approval in this worktree's `.harness/approved-writes.json`
   for the exact protected paths below. Install the unchanged develop lockfile
   with `pnpm install --frozen-lockfile`; no new dependency is proposed.
4. Confirm guarded counts and fixture provenance show only disposable test data,
   then reset only project `wedding-a7dd5180a5a7` (database port 39461) using
   `pnpm db:reset`. This requires an explicit exception because the superseded
   0013 was locally applied. Do not reset if data provenance is uncertain.
5. Apply the combined migration history twice, compare counts, check all RLS,
   rerun publication database/browser tests and the full gate, then commit/push.

## Exact protected paths

Unchanged from pinned develop:

- `pnpm-lock.yaml`
- `drizzle/0013_fresh_doctor_faustus.sql`
- `drizzle/0014_invitation-photos.sql`
- `drizzle/meta/0013_snapshot.json`
- `drizzle/meta/0014_snapshot.json`

Reconciliation/generator outputs:

- `drizzle/0013_theme-published-tokens.sql` (remove superseded branch-only file)
- `drizzle/0015_theme-published-tokens.sql`
- `drizzle/meta/0015_snapshot.json`
- `drizzle/meta/_journal.json`

Authorization record: `.worktrees/TICKET-181/.harness/approved-writes.json`.
No production database application, other stack reset, policy change or PR merge
is included. Existing local history remains intact until approval. The earlier
TICKET-175 integration exception does not cover these operations.
