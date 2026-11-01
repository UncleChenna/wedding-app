# Ticket

TICKET-125 — Document and enforce secrets handling and key rotation.

# Summary

Application lint previously accepted direct, computed and aliased private environment access in browser-capable modules. Startup validation also silently ignored new NEXT_PUBLIC names. This change rejects those paths and documents rotation procedures without changing live credentials.

# Changes

- Add an ESLint environment-boundary rule to the existing lint gate. Private reads require server-only poisoning; instrumentation is the explicit bootstrap exception. Client directives cannot inherit that exception.
- Allow the three approved public settings, NODE_ENV and the shared logger's non-secret LOG_LEVEL access. Reject process/env aliases, static and dynamic process imports, erased type-only server markers and unapproved public names.
- Reject unexpected NEXT_PUBLIC configuration at startup, reporting names without values.
- Add positive/negative tests against the actual ESLint configuration and environment parser.
- Add docs/security.md covering database, gate signing, public verification keys, provider credentials, access ownership, routine/compromise rotation, offline scanner revocation limits and rollback. Link it from architecture.

# Acceptance criteria and evidence

- Client secret access: focused tests pass for direct/computed reads, aliases, imports, server-only misuse and secret public names. Existing Next server-only poisoning remains active for transitive client imports.
- Rotation documentation: current credential inventory and procedures are recorded. WhatsApp Cloud API/service credentials are not consumed by this app; future integration must add its server schema and provider-specific operational verification.
- Both functional acceptance criteria are verified locally; required GitHub checks remain mandatory.

# Verification

Base develop:02c992376250d39ffc1a96a7e80a5860f3641f45.

- Initial baseline:14 negative cases failed;4 permitted reads passed.
- Extended baseline:3 additional gaps reproduced.
- Focused final suite:28 cases pass. Three further review cases (global process alias, type-only server marker, dynamic process import) failed before correction and now pass.
- Quick verification:lint,types and related unit tests pass.
- Final full verification:600 unit cases pass,26 skipped; production build passes;663 browser smoke cases pass,135 skipped (15.1min). Skips are not certified.
- The final local gate used the installed Vitest-supported VITEST_MAX_WORKERS=2 because the default-worker run hit three5s timeouts in existing Git-heavy harness tests under high machine load. All tests, assertions and timeouts remain unchanged.
- Earlier cold ESLint configuration loading was corrected by statically importing the actual project config. The initial sandboxed rerun failed socket/subprocess checks; verification runs with required permissions.
- Code verified:e146c0b4b9e7f004d4873ee505301187b4658c7e. Required CI passed on that commit; final-head checks remain mandatory after metadata/evidence updates.

Managed database setup initially failed because the old primary-checkout generator omitted admin-code.html. Resuming setup with TICKET-208's updated generator copied the template, started the isolated database and applied migrations successfully. No generated file is edited manually and no other stack is changed.

# Risks and rollout

No dependency, CI, migration, RLS or real secret changes. Adding a legitimate public variable now requires updating the schema, lint allowlist, example and tests together. These controls prevent common accidental exposure; they do not scan literal secrets or prove server responses never serialize private values. Real provider rotations, deployment grants and offline scanner refresh require authorized operational rehearsal.

Rollback: revert this ticket's source/config/docs; no database conversion is needed. Never restore a compromised credential as a code rollback.

# Screenshots and UI checklist

N/A: no rendered UI, tokens, motion or QR output changes.

# Remaining

The normal ticket PR gate passed and moved the ticket to in_review. Require final-head GitHub checks before merge. No real credential rotation has been performed.
