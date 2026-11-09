# Ticket

Ticket: TICKET-221

# Summary

The scanner verifier's WebKit CI requirement changed its browser installation command, but the CI parity assertion still expected Chromium alone. PR #127 was externally merged while that check was red. This follow-up restores the exact workflow contract and also checks named run steps that the previous parser missed.

# Changes

Only `scripts/__tests__/ci-parity.test.ts` changes implementation. The ordered command assertion now requires frozen dependency installation, Chromium and WebKit, agent checks, database migration, full verification, and the dedicated scanner suite. Both named and unnamed run steps are inspected. Existing workflow commands, tests and timeout budgets are unchanged.

# Acceptance criteria and evidence

- Exact ordered commands include both browser engines and every required gate.
- Failed CI run 42615319117 at 8961a2ac reproduced locally before the fix: one parity failure; expected Chromium-only versus actual Chromium+WebKit. Local corrected parity suite: 2/2 passed.
- Fresh branch starts at develop b1a15b6443016e8bab248802ae0962cc521e6435. No scanner implementation commits or unrelated work were carried; only the new ticket definition and bounded test correction.

# Verification

Original failed CI: 1,333 unit tests passed, 150 skipped, one parity failure; elapsed 3m16s, not a timeout. Failed log preserved at `/tmp/TICKET-057-ci-failure.log`, local red/green at `/tmp/TICKET-057-ci-parity-{red,green}.log`.

The old TICKET-057 checkout's full unit rerun passed parity but exposed a separate existing hook-fixture isolation issue: its exact-path lockfile approval made a test expecting denial fail. Result: 1,333 passed, 150 skipped, one hook test failed. That is not represented as a pass. This fresh checkout has no such approval record; its full unit suite passed **1,378 tests**, with **153 skipped** across 206 files (95.60s). Database tests remain unrun locally. Quick verification passed lint, typecheck and 2/2 related parity tests. Full database/browser CI remains required on the final repair head.

# Risks and rollout

Test-only repair; no application, database, dependency, secret, runtime permission or workflow behavior changes. Revert this commit to restore the old assertion. TICKET-057 stays blocked on this repair's passing final CI; physical scanner certification remains TICKET-114/163.

# Screenshots

N/A: no UI changes.

# UI checklist

N/A: no UI, route, style or interaction changes.

# Harness changes, if any

Strengthens CI contract coverage to include named steps. No assertions, lint, hooks or timeouts are removed or weakened.
