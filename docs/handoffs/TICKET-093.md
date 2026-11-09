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

## 2026-11-09 browser verification

Integrated develop886c46cc (051+090); preserved create-invitation links and all routes, moved seating into the protected admin frame. Build passes.13 focused tests pass including4isolatedDB. Browser2/2 passes21.6s,24axechecks,24screenshots, initialCLS0,375/600/768/1280overflow/targets. Fixed reviewed pending-dialog race and delete-confirmation focus; delayednetwork/keyboard regressions pass. Accessible button label corrected after realaxe failure. Finalvisual review and quick/CI pending. Current branch is sole093editor; ownDBrunning. Next: review screenshots, finalquick, commit/push and normalt:pr; merge onlycleanindependentreview +exactheadCIgreen.

## 2026-11-09 ready for CI

Independent source/visual review clean at9665126d after all24screenshots inspected. Integrated CSV developb5fa06c9 without conflicts; focused route/export/seating tests rerun. Final quick lint/types pass (no affected tests selected for finalUI files); explicit prior13tests and2browserjourneys retained. Publish through normal t:pr, then wait exact-head fullCI before merge. No production operation.

## 2026-11-09 admin typography correction

Reopened viaCLI to enforce the canonical18pxadmincontrolrule rather than shared16pxdefaults. Scoped editorstyles nowcoverbuttons/inputs/selects/labels/bodycopy. Added actualcomputedfont-size browser assertions alongside24axechecks; bothjourneyspass16.7s and build/quicklint/typespass.24screenshotsregenerated forvisualre-review. OwnDBstoppedagainbackuptrue(projectwedding-d67592a8d3bc), slotreleased182. Nootherownerstacks touched.

## 2026-11-09 print-list integration

Integrated develop716695ca after069 merged. Sole assigned integration editor resolved header/routes conflicts retaining all three Add/Print/Seating actions; navigation regression asserts each destination.23focusedtests andquicklint/types/118relatedpass(1opt-inskipped). No DB restart or seating/typography/screenshot changes. Push checkpoint for parent read-only review, then normal t:pr; parent coordinates final-head CI/merge.
