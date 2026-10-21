# Ticket

Ticket: TICKET-186

# Summary

Rename all 186 ticket filenames and canonical IDs from WED to TICKET. Update dependencies, generated boards, docs, shared agent instructions, CLI parsers, allocation and commit rules. Numeric suffixes are unchanged.

Existing worktrees keep their branches. Legacy CLI arguments resolve to canonical IDs, and both old/new clients continue using the same internal ledger keys so an active claim cannot be duplicated. Regression coverage checks numeric parsing, ledger overlay, legacy branches and the two-clone claim race.

Validation: full pnpm verify passed with documented public local defaults: 73 unit tests, production build, 17 smoke passes and 7 existing skips. All 186 tickets validate and render is idempotent. Live old/new lookups return the same active claim.

# Screenshots and UI checklist

Not applicable: ticket naming and tooling only; no product UI changed.

# Harness changes

Shared workflow skills, commit/PR naming, ticket validators and CLI support the new canonical prefix. Historical handoff prose and internal legacy identifiers are retained for compatibility. This PR is stacked on divine/HARNESS-002-backlog-audit, which contains the audited backlog; review that foundation first.
