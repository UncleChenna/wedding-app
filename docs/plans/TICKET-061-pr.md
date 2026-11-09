# Ticket

TICKET-061 — Admit arriving guests with partial counts.

# Summary

This draft adds committed partial admission after the existing read-only pass check.
It will unblock arrival counters while preserving server-side allowance and replay checks.

# Changes

Planned: count selector, authenticated same-origin admission endpoint, locked current
eligibility decision and immutable idempotent online event. No offline queue or shared
session-wrapper implementation is included.

# Acceptance criteria and evidence

All criteria remain incomplete. Required evidence:2of4 then2remaining, duplicate
request causes no extra admission, clear over-admit refusal and independent UI review.

# Verification

Implementation and tests pending. Managed worktree starts from develop2df977c6.
No database or production operation has run for this ticket.

# Risks and rollout

Must integrate merged TICKET-108 before final merge. No Next server-action import in
the standalone scanner. Physical-phone and offline release gates remain mandatory.

# Screenshots

Pending implementation and actual browser evidence.
