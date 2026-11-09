# Ticket

Ticket: TICKET-221

# Summary

The scanner verifier's WebKit CI requirement changed its browser installation command, but the CI parity assertion still expected Chromium alone. PR #127 was externally merged while that check was red. This follow-up restores the exact workflow contract and also checks named run steps that the previous parser missed. The repaired CI then exposed a real Linux WebKit signature-canonicality difference, which is fixed here without weakening its browser assertion.

# Changes

`scripts/__tests__/ci-parity.test.ts` updates the workflow contract. The ordered command assertion now requires frozen dependency installation, Chromium and WebKit, agent checks, database migration, full verification, and the dedicated scanner suite. Both named and unnamed run steps are inspected. Existing workflow commands and timeout budgets are unchanged.

The shared token verifier now checks RFC 8032's scalar bound `S < L` before either crypto backend, using the Ed25519 field order from the existing library. Linux WebKit native verification accepted a noncanonical high-S signature that strict JavaScript and macOS native verification rejected. A deterministic regression reproduces a permissive native backend and proves the high-S signature is rejected before native verification is called. The original cross-browser rejection assertion stays unchanged.

# Acceptance criteria and evidence

- Exact ordered commands include both browser engines and every required gate.
- Failed CI run 42615319117 at 8961a2ac reproduced locally before the fix: one parity failure; expected Chromium-only versus actual Chromium+WebKit. Local corrected parity suite: 2/2 passed.
- Fresh branch starts at develop b1a15b6443016e8bab248802ae0962cc521e6435. No original scanner implementation commits or unrelated work were carried; the later narrow canonical-signature guard addresses the integration failure observed on this branch.

# Verification

Original failed CI: 1,333 unit tests passed, 150 skipped, one parity failure; elapsed 3m16s, not a timeout. Failed log preserved at `/tmp/TICKET-057-ci-failure.log`, local red/green at `/tmp/TICKET-057-ci-parity-{red,green}.log`.

The old TICKET-057 checkout's full unit rerun passed parity but exposed a separate existing hook-fixture isolation issue: its exact-path lockfile approval made a test expecting denial fail. Result: 1,333 passed, 150 skipped, one hook test failed. That is not represented as a pass. This fresh checkout has no such approval record; its full unit suite passed **1,378 tests**, with **153 skipped** across 206 files (95.60s). Database tests remain unrun locally. Quick verification passed lint, typecheck and 2/2 related parity tests. That repair head passed full database/browser CI as recorded below; the combined final head remains subject to the same gates.

- CI run `42618562083` at `7f1cdcfc` passed full `pnpm verify`, then the dedicated browser suite failed 1/4: Linux WebKit native verification accepted `noncanonical high-S`. Failure log: `/tmp/TICKET-221-ci-failure.log`. Deterministic permissive-native regression failed before the guard (`/tmp/TICKET-221-high-s-red.log`); after the guard, 31 focused signer/scanner/parity tests and all four unchanged Chromium/WebKit browser scenarios pass locally. Quick lint/types/69 related tests pass (one database test skipped). CI run `42623016949` at `bfe75af5` subsequently passed all five required checks, including the unchanged Linux Chromium/WebKit scanner suite. This is a concrete security fix, not a retry or a timeout adjustment.

# Risks and rollout

Test-contract and signature-format repair; no database, dependency, secret, runtime permission or workflow changes. Reverting the scalar guard restores the known Linux WebKit malleability acceptance and is not recommended. TICKET-057 stays blocked on this repair's passing final CI; physical scanner certification remains TICKET-114/163.

# Screenshots

N/A: no UI changes.

# UI checklist

N/A: no UI, route, style or interaction changes.

# Harness changes, if any

Strengthens CI contract coverage to include named steps. No assertions, lint, hooks or timeouts are removed or weakened.

# Final integration and review

Root independently reviewed both parity and scalar-bound changes without blocking findings. All five checks passed on repair head `bfe75af5` in [CI run 42623016949](https://github.com/UncleChenna/wedding-app/actions/runs/42623016949). Develop `1f619b05e305fc4e2a4b4d8efff9a7792f3b4d73` was subsequently integrated without conflicts in `31deec7`; normal commit verification passed. Required CI must pass again on the final combined head before merge. No local database was started.
