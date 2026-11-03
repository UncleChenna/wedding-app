# Staff PIN authentication

TICKET-031 implements the PIN boundary for `/checkin`, `/kitchen` and `/bar`.
The scanner and order boards themselves remain their respective feature tickets.
Account creation, PIN assignment/reset and role management remain TICKET-096.

## Credentials and sessions

Six ASCII digits are hashed with asynchronous scrypt (N=32768, r=8, p=1), a fresh
32-byte salt and a 64-byte digest. Verification supports this bounded envelope
only and compares digests in constant time. Leading zeroes are preserved. An
ambiguous PIN across any roles fails closed rather than choosing a staff identity.
PINs, hashes, signed cookies and database exception parameters are never logged.

`STAFF_SESSION_SECRET` is a private 32-byte cryptographically random key encoded
as 64 lowercase hex characters. Configure the same value on each application
instance through the deployment secret store. Empty configuration disables staff
sign-in; malformed configuration fails environment validation. Never put it in a
public environment variable or commit it. Rotation invalidates existing sessions
and device cookies. No real deployment secret has been configured by this ticket.

Two httpOnly, same-site-strict, root-scoped cookies identify the device and the
session. Production cookies are secure. The session contains staff ID and role
plus expiry, issue time and credential-version security metadata, never a PIN,
hash, name, email or guest data. Its signature binds it to the signed device ID.
Every protected reader must call `currentStaff(role)`; lower-level consumers may
call `authenticateStaff`. A valid signature alone does not grant access: current
staff/device revocation, role, credential version and expiry are checked in the
database. Later server actions must repeat authorization at their own boundary.

Expiry is the earlier of PIN expiry and 06:00 on the day after the event in the
configured venue time zone (ADR 0020). Missing event/time-zone settings fail
closed; no venue time zone is invented. Sign-out clears the session but retains
the device identity so it cannot reset the device lockout counter.

## Attempt accounting

Migration 0011 adds only an RLS-enabled attempt table with opaque device ID,
failure count and window start. No client policies are granted. Transactional
row locking serializes attempts across app instances. Credential queries reuse
that connection to avoid exhausting the pool with nested queries. Five failures
in a ten-minute window lock the device; the fifth response is already locked.
Successful sign-in clears failures. Eight concurrent requests execute only five
credential checks in the database regression.

This is a per-browser-device limit, not a claim of global abuse prevention.
Clearing cookies creates a fresh device identity; broader abuse controls remain
TICKET-185. PIN verification scales with the number of staff credentials;
do not treat this small-event design as an unbounded multi-tenant identity service.

## Verification commands

Run `RUN_STAFF_DB_TESTS=1 pnpm exec vitest run scripts/__tests__/staff-auth.integration.test.ts scripts/__tests__/staff-attempts.integration.test.ts`
only against the managed isolated database. The auth fixture refuses to overwrite
existing event settings and removes only its own synthetic records.

After `pnpm build`, run `pnpm exec tsx scripts/test-staff-journey.ts`. It supplies
an ephemeral signing key only to the test process tree and tests mobile/desktop
wrong PIN, lockout, expiry, sign-out, device revocation and both role directions.
The normal verification suite separately checks all themes and widths, keyboard
operation, accessibility, text sizes and tap targets. Real phones remain untested.
