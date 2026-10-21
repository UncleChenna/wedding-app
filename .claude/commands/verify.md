---
description: Run the full pnpm verify gate and report results per stage
argument-hint: "[fix]  (optional: also fix failures)"
---

Run `pnpm verify` (format:check → lint → typecheck → test → build → e2e smoke).

Report a short table: each stage with ✔ / ✖, and for each failure the root cause in one line with `file:line`.

- If the arguments contain `fix` ("$ARGUMENTS"): fix the failures (never by weakening or deleting tests, or disabling lint rules), then re-run `pnpm verify` until it passes or you are truly stuck.
- Otherwise do not change any files.

If `format:check` is the only failure, the fix is `pnpm format`.
