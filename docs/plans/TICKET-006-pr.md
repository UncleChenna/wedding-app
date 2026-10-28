# Ticket

TICKET-006 — [ticket](../../tickets/TICKET-006-prove-the-managed-worktree-lifecycle-end-to-end.md).

# Summary

Proves the managed worktree lifecycle against develop `763430841153fe7b8fdba68594e0b4af54d56adc`. Two isolated worktrees migrated and served browser suites concurrently; cleanup rejected dirty/unmerged work and removed only the merged disposable control. A failed-start target mismatch discovered earlier is fixed by merged TICKET-205, included unchanged here.

# Changes

- Correct exact ticket branch naming and per-ticket status syncing guidance.
- Document safe recovery from Docker VM memory exhaustion using only completed owned stacks, preserving backups.
- Record dated lifecycle evidence and historical failed attempts in docs/reviews/TICKET-006/README.md and docs/handoffs/TICKET-006.md.
- Carry unchanged merged develop artifacts, including explicitly approved lockfile and theme schema; no new application, schema or dependency change.

# Acceptance criteria and evidence

- Concurrent guarded migrations: both exit0, ten empty tables and two migrations each; DB ports34801/25881 and distinct PostgreSQL cluster identifiers. Identical probe IDs held distinct values in concurrent transactions and were rolled back.
- Concurrent browser smoke: each suite415 passed/111 conditional skips in12.2m, no retries; ports34811/25891. Automatic development ports34810/25890 each served HTTP200.
- Removal safeguards: dirty control rejected; clean unmerged TICKET-006 rejected by ancestry check. Clean merged TICKET-205 removed successfully; only its containers, volumes and checkout disappeared, branch retained.
- Survivor: TICKET-006 DB counts unchanged and home page HTTP200 after control cleanup.
- Documentation corrections and complete historical evidence committed.

# Verification

Ticket validation, formatting, lint and typecheck passed. Unit tests:405 passed,10 opt-in DB skips. Production builds passed in both checkouts. Concurrent smoke results above cover all526 selected tests per checkout, with111 existing conditional skips. `pnpm t:pr TICKET-006` runs the complete gate before moving to review; inspect its result and required CI checks before merge.

Initial five-worker browser runs timed out on QR decoding under load and were cancelled; complete one-worker reruns passed without weakening tests or timeouts. Initial database commands failed during VM memory exhaustion; after safely stopping two completed owned stacks with backups, the guarded reruns passed. No skipped test is represented as passing.

# Risks and rollout

Local rehearsal does not prove arbitrary machine capacity, physical-device QA or production migration safety. Realtime service readiness is not asserted by migration/HTTP checks. No production data was touched, no fixture writes persisted and no application behavior changed. The completed disposable control database was intentionally removed. Revert documentation commits to roll back guidance; no migration rollback is needed.

# Screenshots

N/A: documentation and lifecycle verification only; no UI changes.

# UI checklist

N/A for screenshots, tokens, typography, mobile, motion, keyboard, contrast, images, performance, copy, components, device sharing, QR and staff feedback: no UI source changed. Full verification is enforced by t:pr.

# Harness changes

Documentation only. No tests, checks or hooks were disabled. Database-target guard implementation belongs to merged TICKET-205.
