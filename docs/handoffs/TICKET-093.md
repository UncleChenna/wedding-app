# TICKET-093 — 2026-11-09

Owner divine/codex; branch TICKET-093, managed worktree. Started from develop after
TICKET-089 merged. Root is sole editor; database has not been started. Current
database slot belongs to TICKET-069 after the completed TICKET-092 integration run.

Plan: docs/plans/2026-11-09-TICKET-093.md. Scanner screens do not exist yet. The
mandatory scanner table-display assertion is explicitly preserved in TICKET-060,
now dependent on093. This ticket verifies current canonical assignment and signed
guest-pass display. No scanner capability is claimed built.

Implemented only pure capacity policy and strict table/assignment input schemas.
Initial missing-module regression failed; three focused policy/validation tests
pass. Quick lint, strict types and the three related tests pass. No backend mutation, page, browser or database
verification exists yet; all product criteria remain incomplete.

Next: read current093ticket/queue, implement authorized repeatable-read plan reader,
row-locked table CRUD and household assignment with stale-state rejection. Keep
capacity warnings advisory. Reject deletion of assigned tables or order history
with clear guidance; no cascaded order deletion. Update invitation and member
tableIds atomically. Add seating page under Guests, dashboard link and keyboard
sheets. Coordinate header links with090create/edit and069print-list changes.

Then real isolated DB concurrency tests, keyboard/all-theme UI evidence and current
pass assignment/renumbering/unassignment checks. Integrate latest develop before
final verification, push and obtain independent review and exact-head CI.

Fresh setup regenerated a one-line template checklist change; that known setup
drift was restored before commit. No user edits existed here.

## 2026-11-09 implementation checkpoint

Added the seating page, table forms, household assignment sheets and authenticated server actions/repository. Independent backend review found concurrent capacity warnings could race; target assignments now serialize with a table row lock. Four isolated database tests pass (canonical guest/pass persistence, stale edits, deletion/order preservation, concurrent warnings). Nine pure/action tests pass. Quick verification passes lint, types and 115 related tests (5 opt-in skipped). Browser/theme/focus verification and current-develop integration remain outstanding; ticket remains in progress and PR122 stays draft. Own isolated database is running for upcoming browser tests. No migration or new dependency.
