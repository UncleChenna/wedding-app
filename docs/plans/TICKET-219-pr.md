# Ticket

TICKET-219 — Require successful verification before direct review transitions.

# Summary

Direct `t:move in_review` previously skipped verification: preflight reported a
pass and the final ledger callback forcibly accepted it. Review now requires the
selected verifier to succeed for the current HEAD in the current invocation.

# Changes

- Separate cheap preflight checks from actual successful verification evidence.
- Remove inherited `TICKETS_VERIFIED_SHA` trust and the final forced-pass override.
- Capture the PR verification HEAD before checks; reject changes during verification.
- Preserve the approved quick-default workflow from TICKET-217/218: `verify:quick`
  locally, `--full` for full local checks, and `t:pr --force-verify` for a fresh full run.
- Preserve draft readiness, ticket startup and all other integrated harness behavior.
- Add 14 real-Git CLI cases for direct/PR success, quick/full failures, forged
  markers, changed HEAD and explicit forced full verification. Failure leaves the
  ticket file and shared ledger unchanged; successful PR handoff verifies once.

# Acceptance criteria and evidence

Four original regressions failed before implementation because the verifier never
ran. The integrated suite now asserts the exact selected command as well as
ledger outcomes, so quick-default behavior is preserved without accepting failures.
The root's earlier independent review found no blocking issue; final integration
review and required CI are pending before merge.

# Verification

- Integrated develop: `37e9202cca611c0c9d68b5749340066ab4e2ce97`.
- `vitest run scripts/__tests__/tickets.test.ts scripts/__tests__/ticket-review.test.ts
scripts/__tests__/verification.test.ts`: 61 passed, including 14 CLI scenarios.
- Local quick gate: lint, types and all 136 related tests passed across eight files.
- Prior head `2da7be90` passed all five required CI checks, including full verify,
  migrations/seed and the invitation journey. New-head CI remains mandatory.
- Historical local full run passed 1,105 unit tests (117 skipped) and build, but
  browser verification was incomplete because the isolated database failed to start:
  240 passed, four failed, five interrupted, 777 not run. It was not a full pass.
  The current approved workflow uses local quick checks plus full CI; no additional
  database was started for this harness-only integration.

# Risks and rollout

No product, schema, dependency or production changes. A previously hidden
verification failure now prevents review publication. Full CI remains the merge
requirement; the quick gate is not represented as full verification.

# Screenshots

Not applicable: CLI-only change.

# UI checklist

Not applicable: no rendered routes or interaction changed.

# Harness changes, if any

This follow-up fixes the review-transition bypass while retaining the separately
approved TICKET-217/218 workflow. Existing ownership, branch, acceptance criteria,
clean/pushed-tree and open-PR checks remain enforced.
