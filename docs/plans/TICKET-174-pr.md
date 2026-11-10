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

Draft implementation. No ticket criterion is certified complete yet. TICKET-062 must
merge before this PR is ready; the new annotation migration is not generated yet.

# Verification

- Foundation: lint, types and 30 related tests passed.
- Review found filters could remain visually selected after clearing navigation;
  regression reproduced the failure and the form now resets from applied URL filters.
- Database tests demonstrate the pre-migration failures in the isolated TICKET-174
  database; green persistence, migration repeatability and RLS evidence remain pending.
- Full verification, authenticated browser evidence and final independent review pending.

# Risks and rollout

Do not deploy this draft. Generate and verify the additive annotation migration after
TICKET-062 merges. No production application is authorized by this PR. Original scan
evidence remains immutable. Notes use predefined choices to avoid storing arbitrary
credentials or private guest text; only the latest 20 per scan are displayed.

# Screenshots

Pending authenticated production browser verification at 375/768/1280 in every theme.

# UI checklist

Not complete. Browser layout, keyboard, reduced motion, contrast, axe and CLS evidence
are pending. No guest photography, QR output or WhatsApp flow changes are proposed.

# Harness changes, if any

None implemented. The local synthetic seed reset must retain all append-only guards
after resetting fixtures for the new annotation table; its regression remains pending.
