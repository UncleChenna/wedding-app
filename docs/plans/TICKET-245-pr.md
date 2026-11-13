# Ticket

TICKET-245

# Summary

Local runtime configuration intentionally permits disabled staff/signing/alert capabilities, so a successful build cannot establish that a complete release is configured. `pnpm env:release --profile preview|production` now performs an explicit offline configuration check without adding secret requirements to ordinary local builds or CI.

# Changes

- Reuse shared application schemas and the existing Ed25519 signing loader. Require the complete implemented release capabilities only in the explicit command.
- Validate remote HTTPS site/project origins, authenticated Postgres with explicit TLS, exact admin emails, independent symmetric secrets and public-only Supabase key shapes. Canonicalize numeric local-host aliases and reject conflicting TLS parameters.
- Return variable names and fixed redacted reasons; never echo supplied values, contact providers, load local secret files or mutate settings.
- Add a tested application-variable table and deployment instructions. TICKET-148 retains every existing provider/deployed-startup criterion and gains this implementation prerequisite.

# Acceptance criteria and evidence

Synthetic profile tests cover missing/malformed configuration, local defaults, unsafe origins, private-host aliases, signing/retired keys, provider-scope mismatch, public key roles, independent secrets and documentation parity. A real child process proves the command accepts a complete synthetic profile, rejects missing profile arguments and fails with redacted diagnostics. No real secret or provider connectivity is used.

# Verification

The initial baseline failed because the validator module did not exist. Final focused verification passed 32 tests across the new preflight suite and unchanged environment/signing boundary suites, including legacy public/service-role JWT shapes and conflicting TLS parameters. Normal repository hooks and required hosted checks remain enabled. Independent source review found no blocking issue; no product UI changed.

# Risks and rollout

This is a configuration-shape preflight, not a deployment certification. It cannot prove project ownership, secret entropy, DNS, TLS certificate policy, connectivity, provider permissions, mail delivery, scheduler operation or isolation between two secret stores. Both explicit profiles require the complete currently implemented capabilities; incomplete development previews can still build normally but do not qualify as release-preflight verified.

TICKET-148 must configure the command in the actual provider deployment step, inject the correct environment values, demonstrate missing configuration blocks that step, and verify startup. Provider provisioning, rotation, migration, backups, performance and physical-device release gates remain separate. No database or dependency migration is required; removing the explicit command rolls back this addition without changing runtime behavior.

# Screenshots and UI checklist

Not applicable: offline command-line configuration validation and documentation only.

# Harness changes

Adds one explicit package command and synthetic tests. Existing local build, startup validation, CI workflows, hooks and secret-store permissions remain unchanged.
