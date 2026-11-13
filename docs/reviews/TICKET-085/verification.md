# TICKET-085 verification

2026-11-13. Managed branch TICKET-085, base bd8692728dd61c46ca8587675a3d6592e7d54377.

- Before implementation: sender unit import failed because the module did not exist.
- Current focused verification: 25 tests pass across provider, dispatch, environment and isolated
  PostgreSQL suites. Five database cases verify committed claim visibility from a second connection,
  overlapping/repeated drains, one send for duplicate phone records, timeout-after-acceptance,
  bounded later pending messages, oversized instructions and opt-out. All HTTP is mocked.
- Production build including TypeScript passes on the final implementation. The first build caught
  incorrect new browser-helper types; those were fixed before the passing build.
- Existing migrations applied to a fresh, private native PostgreSQL cluster on this worktree's
  reserved port20541. No migration/schema changes, production data or collaborator stack touched.
  An initial attempt on a non-reserved local port was correctly rejected by database-target checks;
  the owned empty cluster was moved to its reserved port before migration/testing.
- Independent review found and corrected early bulk reservation, duplicate-number sends, legacy
  acceptance wording and stale polling responses. The provider deadline is checked before consent
  I/O and again afterward. Oversized whole orders are explicitly failed without HTTP/truncation.
- Staff-board production browser check passes (3.1s;4.2s total): synthetic PIN sign-in, warning
  visible, existing order/actions available, reload preserves failed-attempt count. Four themes
  pass axe with zero violations and no375px horizontal overflow. Four screenshots are committed
  alongside this report and were visually reviewed. The initial new locator found hidden sheet
  content; it now scopes to the actual order list. No pre-existing assertion changed.
- Normal final commit hook passes: ticket validation, formatting/lint, TypeScript and related unit
  tests. Implementation committed as51a0d8a3 and pushed in PR208. Hosted CI remains pending.
- Live staff phone, actual Meta template/account, asynchronous delivery receipts: not verified.
  TICKET-083 remains required for live sending; this ticket cannot be marked done without its live test.

## Staff UI checklist

PASS:375px screenshots, all-four-theme axe/contrast, semantic warning tokens plus visible text,
restrained18px body text, no overflow, existing order actions remain enabled. Every screenshot
was inspected; no clipped alert text or controls. No animation or interactive control is added,
so new motion/keyboard/tap-target behavior is N/A. Warning is server-rendered with initial board
state. Sharing, guest page Lighthouse, camera and QR are N/A to this staff-only status indicator.
Physical phones and whole-page zero-CLS were not measured here; existing release gates remain.
Realtime is unavailable in this minimal native database, so screenshots honestly show Reconnecting;
this test does not certify realtime delivery. The bar uses the same component/schema but was not
separately signed in during this check. Final full CI is pending.
