# Ticket

Ticket: TICKET-169

# Summary

The gate work (pass signing, the scanner, offline sync) couldn't start until two things were settled: how the QR
pass relates to the personal RSVP link, and what a disconnected scanner may trust. This PR records the approved
contract. The owner approved all 12 decision rows on 2026-11-01.

# Changes

- `docs/decisions/0020-gate-pass-credential.md`: accepted ADR. It covers:
  - a read-only `/p/` pass kept separate from the `/i/` RSVP link
  - a minimal Ed25519 payload with no personal data
  - party allowance read from the scanner's cached guest list
  - 5-minute refresh, plus a stale-list banner after 30 minutes
  - expiry at 06:00 the day after the event
  - the lost-device response
  - a 10-minute clock-skew limit
  - accepting and flagging double entries from offline scanners
- `docs/prd.md`: Journey 1 step 5 and the Security section now say the QR is a read-only pass, separate from the
  RSVP link, and link to the ADR.
- `tickets/TICKET-169-…`: the approved decision table, owner and date; criteria ticked.
- `docs/decisions/README.md`: index entry. `docs/handoffs/TICKET-169.md`: handoff.

# Acceptance criteria and evidence

- [x] QR URL decision approved and recorded: row 1, ADR decision 1, and the PRD amendments. No RSVP editing from a
      pass.
- [x] Snapshot age, expiry, lost device, clock skew and stale revocation wording approved: rows 3–5 and 9–11, and
      ADR decisions 4, 6, 7, 8 and 9.
- [x] Party-size edits, reissues and excess admissions specified: rows 6–8 and 12, and ADR decisions 3, 5 and 10.

# Verification

- `pnpm t:validate`: all tickets valid.
- Prettier is clean on the changed files.
- `pnpm verify` runs through `pnpm t:pr`; the result is reported in the PR conversation.
- Docs only: no code paths change.

# Risks and rollout

No code implements this yet. TICKET-056, TICKET-057, TICKET-065 to TICKET-068 and TICKET-136 carry the
implementation and tests.

Row 5 deliberately accepts that a revocation made after a scanner's last refresh can still read green on that
device. Staff training (TICKET-162) must cover this.

To roll back, revert this PR. The payload carries a version, so a later format can replace this one.

# Screenshots

N/A: documentation only, with no UI change.

# UI checklist

N/A: documentation only. No route, component, style or copy shown to users changes.

# Harness changes, if any

None.
