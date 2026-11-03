# TICKET-070 handoff

2026-11-03; owner divine; agent codex; branch `TICKET-070`; worktree `.worktrees/TICKET-070`.

Base develop: `be0d656343ad3d31af0f904c3a8763c6f94dc598`. Implementation commit: `7d5a249`, pushed. PR publication pending final evidence commit and `pnpm t:pr TICKET-070`.

## Result

Anonymous `/order` now accepts a numeric table number, checks the real table list, saves a canonical session cookie, revalidates it on reload, and lets the guest change tables. Uses shared Input/Button and PRD heading. Unknown/stale/tampered values and unavailable lookup/cookie writes receive fixed safe errors. No invitation/sign-in required. Menu remains TICKET-071 and the UI explicitly says it is not open yet.

Changed: order route, ordering module components/lib/server, two unit test files, opt-in `e2e/table-selection.spec.ts`, module README, ticket plan/review/handoff and this ticket's acceptance notes. No migrations, dependencies, generated schemas, lockfiles or RLS changes.

## Evidence

- Quick gate: lint/types/16 related tests pass.
- Full gate: 788 unit tests pass, 41 optional/integration skips; production build passes; 769 browser checks pass, 165 optional skips.
- Dedicated production table suite: 2 tests pass in 9.7s, with synthetic database rows removed by ID; validates native no-JavaScript forms, errors/focus, session reload/change/isolation, stale and tampered cookies, all-theme axe/overflow.
- Standard screenshot command: 12 cases pass. Clean production recapture: 12 cases pass. 36 final entry/error/selected images reviewed at 375/768/1280 across all four themes in `docs/reviews/TICKET-070/`.
- Lighthouse: three serial production runs, Performance 100/100/100, Accessibility 100/100/100, CLS 0/0/0. Logs in ignored `artifacts/TICKET-070/`; portable evidence in review docs.

## Findings

Server Action forms insert hidden inputs; focus the visible `#order-table`, not the first input. A streaming fallback required script execution to expose the form; request-time blocking rendering fixes native access. Serialized returned action state did not display native errors in this framework build, so POST/redirect/GET uses allowlisted error codes and bounded public table input. Both defects were reproduced and covered before correction. Initial formatting/lint failures were fixed without weakening checks.

The cookie is convenience only; future order creation must validate table/menu state again. Session restoration can retain browser session cookies. Supporting copy is provisional Warm voice. Cached metadata emitted development serialization warnings; production screenshots are clean and no unrelated metadata changes are included.

## Remaining work and exact next action

Commit the final evidence and run `AGENT_OWNER=divine VITEST_MAX_WORKERS=2 pnpm t:pr TICKET-070`. Recheck CI, leave in_review for human merge. The latest user merge exception covered only PRs48/68/74/75 (already merged), not this ticket. Physical iOS/Android keyboard/safe-area/WhatsApp checks remain NOT VERIFIED in release-blocking TICKET-201 under the standing preview exception. Do not certify release readiness.

The isolated stack is `wedding-b5d3dc8957e0`; app30950, browser30951. Stop only this owned stack with backup preservation after verification. Do not alter TICKET-046's pending lockfile or other worktrees. Process-scoped caffeinate prevents sleep during verification; no persistent power settings changed.
