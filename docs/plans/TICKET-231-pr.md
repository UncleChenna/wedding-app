# Ticket

Ticket: TICKET-231

# Summary

Recover retained offline admissions after gate credentials expire without restoring gate authority. The original browser exports minimal records; an authorized admin explicitly reviews/imports them, then returns a signed receipt that clears only exact committed evidence.

# Changes

- Add bounded strict export/import contracts and two-step admin authorization rechecked within each record transaction.
- Preserve original UUID, actor and device provenance through existing reconciliation; atomically append recovery audit digests and scan-log notes before acknowledgement.
- Add RLS-enabled append-only `scan_recovery_audits` with generated migrations 0033/0034. No browser policies or existing admission guards change. The generated trigger declaration is falsely classified destructive by the hook; its exact path authorization is recorded under the user’s standing instruction, without changing the hook.
- Add public local-device recovery and protected admin review pages with entry/return links. Public recovery grants no staff/admin authority and uploads no records until an administrator explicitly imports them.
- Sign receipts using a separate HMAC domain on the existing server secret. Online receipt verification validates expiry; local cleanup matches complete record identity before acknowledging.
- Make TICKET-231 a direct release TICKET-154 prerequisite; extend existing authenticated admin and scan-sync test lanes.

# Acceptance criteria and evidence

All six criteria have implementation and automated evidence: expired authority remains denied; explicit admin review and strict bounded input gate writes; original UUID replay is idempotent; exact signed receipts clear only committed records; entry/return links and operational documentation are present; TICKET-154 directly depends on this ticket.

# Verification

- Seven focused unit tests pass: bounded schemas, secret/duplicate rejection, explicit review, same-origin/admin enforcement, streamed-size cancellation, HMAC tampering/expiry and signed exact acknowledgement.
- Fifteen actual scan-sync database tests pass, including revoked historical actor recovery, repeated import idempotency, rejected UUID conflict audit, authority loss and audit failure rollback.
- Ten historical migration/seed-guard tests pass on owned native PostgreSQL at the assigned port (0.8s). Prior Docker runs hit connection timeouts; no assertions/timeouts were weakened. The owned Supabase stack was stopped with its backup preserved after actual browser/database tests.
- Migrations applied twice; row counts identical; RLS enabled on all 27 public tables.
- Production build passes after correcting a test helper type. Initial browser run exposed an ambiguous status selector; scoped repair retains its assertion. The final production build and complete journey pass mobile and desktop (2 tests, 24.0s), including duplicate import, conflicting-record retention, forged receipt rejection, reload and idempotent exact cleanup. An intervening mobile MFA enrollment stall is preserved as an unclaimed failed run.
- Independent critical-path review found no blocking authorization, transaction, signed-receipt or evidence-retention issue.

# Risks and rollout

Apply generated additive 0033/0034 before the new API; no production application is performed here. Audit rows are append-only. Local synthetic seed reset temporarily disables only the named audit guard in the existing transaction, restores it before inserts, and passed two synthetic seed runs with identical row counts. Concurrent migration numbering must be reconciled against latest develop before merge.

Recovery files are untrusted claims, so an admin must check the original device/operator and explicitly approve. Deleted original staff/device rows cannot be reconstructed automatically. Full-origin loss cannot restore evidence. Receipts expire after 24 hours; replaying the same reviewed import regenerates a receipt without double-counting. Pending/rejected/mismatched records remain local; do not clear browser data. Physical-phone file transfer remains release QA.

# Screenshots

Actual authenticated screenshots: `docs/reviews/TICKET-231/mobile/` (both pages in four palettes at 375px, plus 768px) and `desktop/` (1280px). Fixtures contain synthetic identifiers only.

# UI checklist

Existing shared buttons, theme tokens, staff-size text, labelled file controls and return links are used. All-theme axe and overflow checks pass, with reduced-motion browser settings and labelled native controls. Screenshots were visually inspected. Physical device file transfer, dedicated keyboard-only journey and fresh Lighthouse/CLS measurements remain release QA; no claim is made that those manual checks passed.

# Harness changes, if any

Existing admin journey runner gains focused `--recovery` mode and includes this journey by default. Existing scan-sync database lane includes the new transactional cases. No checks, hooks or test assertions were weakened.

# Develop integration

Integrated develop `7a43077b`, preserving TICKET-079 migration0032 unchanged. Regenerated only this ticket’s audit migration as0033 and immutable guard as0034; generated SQL is unchanged from the reviewed recovery implementation. Combined history applies twice on a fresh isolated native PostgreSQL database; no production application or deletion occurred.
