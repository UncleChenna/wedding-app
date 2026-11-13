# Ticket

Ticket: TICKET-229

# Summary

Adding the visual regression job makes metadata-only CI contain eleven skipped jobs instead of ten. The strict repair-evidence reader previously treated that newer metadata run as code verification and rejected valid earlier full evidence. Recognise both exact workflow shapes while retaining fail-closed provenance checks.

# Changes

- Preserve the exact historical ten-job set and add only the known visual-regression eleven-job set.
- Retain strict expected head, pull-request event, completed/skipped jobs, known expression aliases and exact cardinality.
- Add a minimal captured GitHub payload from actual metadata run 43279926245 and regressions for valid and malformed cases.

# Acceptance criteria and evidence

- Historical resolved names and captured unevaluated GitHub expressions remain accepted.
- The actual eleven-job payload and resolved visual-job variant are accepted.
- Missing, duplicate, unknown, altered-expression, wrong-head/event, failed and pending cases are rejected.
- Earlier full evidence survives either valid metadata event; newer actual pending or failed code verification remains blocking.

# Verification

- Before the fix: two regression failures and thirteen passes.
- After the fix: all fifteen reconciliation tests pass.
- `pnpm verify:quick`: lint, types and fifteen related tests pass.
- Independent review found no blocker in exact job-set matching or provenance checks.
- PR-167's neutral Linux-baseline sentence was reworded without changing meaning. Standalone PR-text run 43279926313 passes. A failed-jobs-only retry of its original run retained the old event body and still fails; no successful heavy job was rerun. PR-167 needs a fresh code event after integration.

# Risks and rollout

No product, database, dependency or workflow changes. Future CI jobs must add an explicit reviewed shape; unknown jobs remain rejected. Reverting restores historical ten-job-only recognition. Hosted CI remains required before merge; no physical or release verification is claimed.

# Screenshots

Not applicable: no UI changes.

# UI checklist

Not applicable: harness-only change.

# Harness changes, if any

Bounded compatibility for metadata-only provenance; no tests, hooks or attribution checks disabled.
