# TICKET-091 handoff — 2026-11-09

Owner: divine. Agent: codex. Branch/worktree: TICKET-091. Root is the sole editor.
Base: develop `b5fa06c90bb4147932ce7367dc50318c38839d48`.
Draft PR: https://github.com/UncleChenna/wedding-app/pull/125.

Started with `--ahead` of TICKET-182 after TICKET-090 completed. The backend public
contract is documented in TICKET-182's `docs/guest-import.md`,
`lib/guest-import.ts` and `server/guest-import-actions.ts` (PR #124).

## Implemented and verified

The isolated UI component uses a display-only view model and injected actions;
there is no duplicate parser or database-writing service. It validates the file
size and strict UTF-8 decoding, invalidates previews on file changes, ignores stale
responses, requires explicit confirmation and reports replay without duplicates.

Eleven focused tests pass, including malformed bytes, BOM/Unicode, row errors,
confirmation, replaced-file races, stale commit, read failure, size limits, expiry
and expiry during commit. The last regression failed before the fix: expiry now
pauses during commit and successful completion clears prior error state.
Confirmation tests wait for an enabled button after preview settlement. Quick
lint/types/related tests pass. Work is committed and pushed.

## Prepared but not verified

`scripts/test-guest-import.ts` and `e2e/admin-guest-import.spec.ts` are opt-in and
have not run. They cover real admin OTP/TOTP, invalid middle row/contact conflict
before writes, 300-row import, replay, existing RSVP preservation and all-theme
preview/error/success evidence. The harness passes typechecking only so far.

There is no production route or backend adapter yet. No TICKET-091 database has
been started. TICKET-182 owns its isolated database verification; coordinate the
single active database slot before starting this stack.

## Next

After TICKET-182 passes final CI and merges, integrate fresh develop (including
069 printable list and093 seating if merged), preserve every Guests navigation
link, then add the thin backend-to-view adapter and protected import page. Run
real browser/database tests, inspect screenshots, obtain independent review and
use normal `t:pr`. Keep this PR draft until dependencies and acceptance pass.
