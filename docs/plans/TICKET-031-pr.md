## Problem and result

Staff routes need expiring PIN authentication with role isolation and persistent
device lockout. This draft adds the authentication backend and approved attempt
storage migration. It does not yet protect routes or provide a usable browser
sign-in flow.

## Changes

- Generate independent random salts and asynchronous scrypt hashes for six-digit PINs.
- Compare digests in constant time; reject unsupported or corrupt envelopes before expensive work.
- Keep credential code server-only and preserve leading zeroes.
- Serialize attempts per device in PostgreSQL and lock after five failures.
- Sign sessions bound to the device and recheck live role, expiry and revocation.
- Cap session lifetime at 06:00 the day after the event in its configured time zone.

## Acceptance evidence and remaining work

- Credential tests: 12 pass, after an initial missing-implementation failure.
- Session tests: four pass for tampering, expiry, wrong device/key and invalid issuance.
- Five cutoff tests pass, including daylight-saving transitions and missing settings.
- Three isolated database tests pass, including concurrent lockout, real PIN sign-in,
  role isolation, expiry and revocation. Repeat migration preserves counts;
  all 15 tables retain RLS. Quick gate passes lint, types and related tests.
- Still required: cookie/action wiring, friendly sign-in screens, browser and
  all-theme UI evidence, and full verification.
- Staff account management remains TICKET-096.

## Risks and rollout

Generated migration 0011 and its authorization record were explicitly approved.
It adds only the attempt-counter table; existing rows and applied migrations are
unchanged. No deployment secret or production database change is included.
Revert application usage before considering table removal; dropping it would lose
lockout counters and requires separate authorization. Browser integration remains
unfinished, and this draft is not ready to merge.

Ticket: tickets/TICKET-031-add-staff-pin-sign-in-with-hashed-expiring-pins.md
Handoff: docs/handoffs/TICKET-031.md
