# Ticket

TICKET-192 — Tidy StatusPanel detail rendering and test selectors.

# Summary

A numeric zero passed as panel detail rendered stray text, and board badges could not choose a more specific icon. Empty detail now renders nothing; badges accept a typed optional icon while retaining their existing tone defaults.

# Changes

- Render optional detail with an explicit null branch.
- Expose stable label/identifier/detail selectors and measure each named element in browser typography checks.
- Export StatusIconName and add the optional StatusBadge icon prop; demonstrate the existing ban icon for Cancelled in /dev/theme.
- Add nine regression cases covering empty detail, retained node content, default icons and overrides in every tone.

# Acceptance criteria and evidence

All three criteria are covered by focused unit tests and the existing staff-status browser test. Screenshots: docs/reviews/TICKET-192/screenshots/. Review evidence: docs/reviews/TICKET-192/README.md.

# Verification

Regression-first run: five failed, 15 passed. After implementation: 20 focused tests passed. Final quick/full gate passed: 251 unit tests, 155 browser passes, 17 conditional skips; screenshot suite six passed. Lint, types, formatting, ticket validation and production build passed. Initial concurrent Playwright commands clashed on shared output files; sequential reruns are the verification evidence, with no assertions weakened.

# Risks and rollout

Numeric zero is intentionally omitted per the ticket; callers wanting a literal zero should pass the string "0". Existing callers preserve their default icons. No data migration or backend changes; revert this ticket to roll back. Showcase-only follow-up, not scanner integration certification. Physical device/release QA stays in TICKET-201 under the approved exception.

# Screenshots

Six staff-section captures cover both themes at 375/768/1280. Open /dev/theme, inspect the staff panels and Cancelled badge in each theme. Labels and identifiers must wrap without clipping, with distinct non-colour cues.

# UI checklist

See docs/reviews/TICKET-192/README.md for per-item evidence and scope exclusions.

# Harness changes, if any

The existing staff typography test now locates semantic content by stable test IDs rather than paragraph position. No CI, hook or verification-policy changes.
