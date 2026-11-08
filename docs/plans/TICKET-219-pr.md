# Ticket

TICKET-219 — Require successful verification before direct review transitions.

# Summary

Direct `t:move in_review` previously skipped `pnpm verify` because preflight set
verification to true and the final ledger update forcibly accepted it. Review now
requires successful verification for the current HEAD in the current invocation.

# Changes

- Separate cheap preflight validation from real verification evidence.
- Remove the forced final verification override and inherited environment marker.
- Capture the PR verification HEAD before running/reusing checks; reject changes.
- Cover both CLI entry points with real temporary Git repositories and isolated
  verifier/GitHub fixtures. Existing ownership, branch, criteria, clean/pushed-tree
  and open-PR requirements remain enforced.

# Acceptance criteria and evidence

The six CLI cases cover direct failure, direct success, forged environment marker,
HEAD changes, one verification through `t:pr`, and changed HEAD through `t:pr`.
Failure cases preserve the ticket file and shared ledger. Four direct cases failed
before implementation because no verifier was invoked, then passed after repair.
Independent read-only review found no blocking issue. Full verification remains
incomplete because this ticket's isolated database could not start; the PR stays
draft until the full gate passes in a working environment.

# Verification

- Before transfer to this branch, on the same develop base: 50 targeted ticket,
  evidence and protected-artifact tests passed; quick verification passed lint,
  types and 40 related tests.
- Current branch quick verification: lint, types and 40 related tests passed.
- Full gate: ticket validation, formatting, lint, types, 1,105 unit tests and the
  production build passed; 117 opt-in tests skipped.
- Browser smoke was stopped after known database failures: 240 passed, four
  failed, five interrupted and 777 did not run (command exit 130). The access
  matrix received 503 instead of 404; gate-pass tests received the retry page
  instead of the pass/not-found page because the local rate-limit store was
  unavailable. No assertions were weakened. This is not a full-gate pass.
- Log: `artifacts/TICKET-219/verify.log`; failure traces: `test-results/`.
- Managed database startup failed. Verification used this ticket's reserved
  loopback endpoints instead of borrowing another checkout's database.
- Base: `407fb68db4dde004cf0868274a744ebd435dbbb2`.

# Risks and rollout

No product code, schema migration or deployment steps. The corrected gate may
surface failures that the previous bypass hid; those failures must be fixed.
CI must complete its full gate with disposable PostgreSQL before review advances;
repeat isolated local verification when database capacity is available.
Verification reuse remains controlled by the existing fingerprint implementation.
Revert only this ticket's code changes if necessary, understanding that this would
restore the original verification bypass.

# Screenshots

Not applicable: CLI-only change with no UI modifications.

# UI checklist

Not applicable: no rendered routes, styles or user interaction changed.

# Harness changes, if any

This follow-up is separate from merged TICKET-215/PR #97. It changes only review
transition evidence and adds regressions; it does not weaken or skip any gate.
