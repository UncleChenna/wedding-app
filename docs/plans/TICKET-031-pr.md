## Problem and result

Staff routes need expiring PIN authentication with role isolation and persistent
device lockout. This draft currently adds only the server credential primitive;
it does not yet protect routes or provide a usable sign-in flow.

## Changes

- Generate independent random salts and asynchronous scrypt hashes for six-digit PINs.
- Compare digests in constant time; reject unsupported or corrupt envelopes before expensive work.
- Keep credential code server-only and preserve leading zeroes.

## Acceptance evidence and remaining work

- Credential tests: 12 pass, after an initial missing-implementation failure.
- Still required: persistent concurrent-safe five-attempt lockout, signed device-bound
  sessions, expiry/revocation checks, friendly states and gate/kitchen/bar isolation.
- Still required: browser and all-theme UI evidence, database tests and full verification.
- Staff account management remains TICKET-096.

## Risks and rollout

No migration, deployment secret or production database change is included yet.
The helper is not wired into routes. A future attempt-storage migration needs
exact-path approval. Reverting this draft removes the unused helper and tests.

Ticket: tickets/TICKET-031-add-staff-pin-sign-in-with-hashed-expiring-pins.md
Handoff: docs/handoffs/TICKET-031.md
