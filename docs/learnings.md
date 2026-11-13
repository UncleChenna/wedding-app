# Project learnings

- Next 16.4 changed error boundaries to `retry` and `error: unknown`; read installed docs before framework changes.
- `next dev` regenerates its managed AGENTS.md block; retain it.
- ESM JSON imports used by Playwright need `with { type: "json" }`.
- pnpm 12 requires build-script approvals in `pnpm-workspace.yaml`; never bypass them.
- Pixel 7 emulation is 412px wide; set 375px explicitly for the mobile design check.
- Turbopack needs local port binding during builds; permission failures require an allowed execution environment, not weakened tests.
- Worktree source is committed Git content, not the primary checkout's dirty files; commit a reviewed foundation before spinning up product worktrees.
- Local task JSON is not a cross-machine lock; claim through the shared Git ledger before editing.
- Supabase project IDs and all host ports must differ per worktree; use the managed scripts, not raw CLI reset.
- Hook exit success must never hide failed formatting or verification; there is no retry-count escape hatch.
- Git directory-only ignore patterns do not match symlinks; ignore `.claude/skills` without a trailing slash.
- Identity fallbacks from environment variables must use `||`, not `??`: an exported empty `AGENT_OWNER` otherwise hides `git config harness.owner`.
- Ticket files are machine-written; change them with `pnpm t:*`, or by hand followed by `pnpm t:render`. Prettier ignores `tickets/`.
- Tests that spawn git must use `isolatedGitEnv()` from `scripts/__tests__/git-env.ts`: git exports `GIT_DIR`/`GIT_INDEX_FILE` to hooks, so a test run by the pre-commit gate can otherwise commit to the real branch or set `core.bare=true`.

- Validate all ticket creation input, including owner and initial status, before reserving a ledger ID. TICKET-194's real-Git regressions verify rejected requests preserve both the ledger commit and lastId; the next valid request receives the expected ID.

- Cached root-layout theme data can make formerly static private placeholders browser-cacheable. TICKET-012's offline regression failed in both browser projects; explicit private no-store proxy headers fixed all twelve PWA checks. Retain both HTTP-header and offline-response assertions when adding root caches.
- Google-font resolution can fail in cold Turbopack CI even when local builds pass. PR54's exact head passed one retry after the resolver error; the failure recurred on PR56. Track the permanent fix in TICKET-207, preserve failed-run evidence, and require a passing final-head gate rather than weakening it.

- 2026-11-02 (TICKET-209): Long local test timeouts can reflect macOS Maintenance Sleep. Confirm timestamps with pmset before changing tests; process-scoped caffeinate -is preserved the unchanged journey assertions (5.8s pass after sleep-interrupted15–16min failures). Keep assertions/timeouts intact and ensure fixture cleanup does not depend on an open browser. No persistent power settings changed.
- 2026-11-06 (TICKET-217): A failing stop hook on a file that only the owner could approve trapped a session for hours (TICKET-084's generated migration). Enforcement belongs at commit; post and stop hooks now report protected files instead of failing, and new `db:generate` output needs no approval (`scripts/__tests__/hooks-migrations.test.ts`).
- 2026-11-07 (TICKET-218): `wt:new` run from a main checkout on an old branch used old harness code and skipped the auth-template copy, so new worktree databases failed to start (it looked like Docker overload). `t:*`/`wt:*` now warn when their checkout's tooling is behind `origin/develop`, and worktrees start the database only on first use.

### 2026-11-09 — Sleep can invalidate local timing evidence

When unrelated Git-fixture tests take hundreds of seconds and fail different timeout
assertions, inspect `pmset -g log` before changing test budgets. TICKET-059 power logs
confirmed maintenance sleep during two failed runs; the unchanged full suite passed
1,477 tests in 52.57s under `caffeinate -is pnpm test`. Use a command-scoped inhibitor
for long local verification on macOS, preserve the failed logs, and keep CI as an
independent check. Do not weaken assertions or permanently alter power settings.

## Quick verification must include dynamically read CI inputs (TICKET-226)

TICKET-123 and TICKET-062 both added test-only CI flags before documenting them in `.env.example`. Vitest's related-test import graph cannot infer that `ci-parity.test.ts` reads workflow/environment files through `readFileSync`. Quick verification now explicitly runs that unchanged test when `.github/workflows/**` or `.env.example` changes, including committed branch changes against local `origin/develop`. It excludes parity from the related invocation only when the explicit invocation will run, so neither checks nor coverage are skipped. Real throwaway-Git command tests prove the missing-flag assertion fails and passes after documentation; no actual repository environment or hook is disabled.

## Bound ledger object preparation without piping JSON (TICKET-243)

Repeated owned ticket publications stalled in `git hash-object --stdin`. Ledger writes now serialize the unchanged JSON into a mode-0600 file inside a mode-0700 temporary directory, and hash it with `--no-filters`. Every preparation command ignores stdin and has a 30-second per-command limit; timeout kills only that owned Git child. Cleanup and the existing three-attempt retry remain intact. Ref updates and pushes deliberately retain their existing acknowledgement semantics: this is not a whole-publication deadline. Real-Git failure, timeout, cleanup, recovery and concurrent-writer tests protect the change.

## Ticket validation during concurrent merges

Use the branch/develop merge-base when determining which ticket definitions already belong to a branch. Comparing with the moving develop tip wrongly makes later merged definitions mandatory on older branches. TICKET-246 reproduces this with isolated repositories and preserves deletion detection plus strict missing-history behavior.

Before the first ticket status commit, use the validator-recognized test-plan labels `Unit:`, `End-to-end:` or `Manual:`. Describing a Git regression without one of those labels fails validation; check the completed definition before starting.
