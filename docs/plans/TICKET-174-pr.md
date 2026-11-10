# Summary

Add an admin scan log for reviewing online checks and reconciled offline conflicts,
with resolution notes that never change the original scan evidence or entry counts.
Ticket: [TICKET-174](../../tickets/TICKET-174-add-the-admin-scan-log-and-dispute-filters.md).

# Changes

- Validated invitation, staff, device, received-time, result, connection and conflict filters.
- Reported/received timestamps and input method remain separate from the five verdicts.
- Admin authorization precedes every read/write; returned fields exclude credentials,
  invitation tokens and dietary details.
- Predefined, separately stored resolution notes with retry-safe request identities.

# Acceptance criteria and evidence

Draft implementation. TICKET-062 is merged and integrated from develop
`7533201c21af3119e26f7a94b1e2985700584307`. The backend contract is proven locally;
authenticated browser screenshots and final combined CI remain pending.

# Verification

- Foundation: lint, types and 30 related tests passed; the expanded focused suite
  passes 34 tests, including form failure/pending/retry behavior.
- Review found filters could remain visually selected after clearing navigation;
  regression reproduced the failure and the form now resets from applied URL filters.
- PostgreSQL: seven scan-log tests pass, including concurrent deduplication,
  different-admin replay rejection, five results, unknown attempts, timestamp filters,
  immutable evidence/notes, bounded pages/history and browser-role RLS.
- Generated migrations 0028/0029 applied twice with identical row/migration counts;
  all 25 public tables retain RLS. Twelve seed/admission tests pass, including
  rollback and successful reset restoration of the new audit guard.
- Full verification, authenticated browser evidence and final independent review pending.

# Risks and rollout

Do not deploy this draft. Additive migrations `0028_scan-resolution-notes.sql` and
`0029_scan-resolution-guards.sql` are generated and verified in the owned disposable
database. No production application is authorized by this PR. Original scan
evidence remains immutable. Notes use predefined choices to avoid storing arbitrary
credentials or private guest text; only the latest 20 per scan are displayed.

# Screenshots

Pending authenticated production browser verification at 375/768/1280 in every theme.

# UI checklist

Not complete. Browser layout, keyboard, reduced motion, contrast, axe and CLS evidence
are pending. No guest photography, QR output or WhatsApp flow changes are proposed.

# Harness changes, if any

The local-only synthetic seed reset includes the new named append-only guard and
restores it before inserting fixtures. The historical rehearsal now installs the
current import/annotation table prerequisites rather than referring to absent tables.
No hook, test gate or existing CI job is removed. The admin CI runner additionally
verifies scan-log SQL and authenticated browser behavior and retains sanitized images.
