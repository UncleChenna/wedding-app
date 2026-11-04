# TICKET-211 approved migration source review

Reviewed on 3 November 2026. Scope: the human-created seven-path source approval only. This branch is based on develop2f066eb; newer develop uses0006–0011 for other work. Integration/renumbering needs a separate exact-path proposal.

**DEPLOYMENT BLOCKED:** source approval and automated checks do not authorize hosted execution, token reissue or real-data deletion. The legacy bridge is destructive and remains a separate target-specific deployment decision.

| Approved path                                      | SHA-256                                                            |
| -------------------------------------------------- | ------------------------------------------------------------------ |
| drizzle/0006_member-rsvp-foundation.sql            | `de0dc6b3eb1d9725030e3a8b508e36999c6ff55322c66dbc5ed401d26785df53` |
| drizzle/0007_member-rsvp-backfill.sql              | `143fab7b6162fb30605e924f4bb1650afcaf97f6b91bad2c82384c4788e03687` |
| drizzle/0008_preserve-large-household-capacity.sql | `33a0467e7899898158238067da8a9473e56d5ec139243abc719209a12df95dcd` |
| drizzle/meta/0006_snapshot.json                    | `0d55026723669290bb86a71dc4110ccbafea2ce8ef5b73464ec5769809d95839` |
| drizzle/meta/0007_snapshot.json                    | `adbec1acb4c4fbe64da22fefb5f5a2e7b5d50aa44d5bf8cc2d4ae3676ef0e0d3` |
| drizzle/meta/0008_snapshot.json                    | `69232344e255a2e13e151419c31e8c687eb6ab6155b17079e1355a21c2da813d` |
| drizzle/meta/_journal.json                         | `0d85944f78bfdda66d908d7a9fc503d8e6ea7e7dd8cc63f250fde4b30616bebf` |

## Review findings

- New0006–0008 SQL adds three RLS-enabled tables, member/household fields, integrity checks, receipts,365-day defaults and deterministic response backfill. No browser policy/grant or guest-row deletion is added by those files. The referenced unique index precedes its composite FK. The foreign keys cascade dependent member/receipt records on a future parent deletion; this is an integrity rule, not permission to delete real data. Existing people/contacts remain untouched by this source set.
- 0008 replaces the old capacity constraint with a nonnegative constraint; it does not add people, reserve seats or implement approval of extra guests.
- Applied0000–0005 are unchanged. Drizzle generation on both a disposable artifact copy and the actual approved snapshot set reports no schema changes. Existing approved artifacts remain byte-identical.
- The separately flagged legacy bridge contains TRUNCATE and runs older schema-destructive SQL. It was previously tested only against local synthetic fixtures. Do not execute it on a hosted target without a reviewed target-specific plan, verified backup, restore rehearsal and explicit execution authorization.
- No invitation-token reissue or hosted database operation was performed during this source-verification session. The approval record was read, not created or modified by the agent.

Detailed rollout/recovery: [migration-rollout.md](../../migration-rollout.md).
