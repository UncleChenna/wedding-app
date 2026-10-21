## Summary

Fix TICKET-002: the pre-tool hook rejected harmless reads of temporary output and shell pipelines because it treated all reads as checkout edits and matched protected names anywhere in shell text.

## Changes

- Permit non-secret reads outside the checkout while resolving symlinks to detect secret aliases. Keep writes confined to the checkout and retain the `.env.example` exception.
- Inspect common shell command operands and redirects using a dedicated static helper. Track simple directory changes; reject dynamic write targets that cannot be verified.
- Protect directory operands as well as descendant paths, including `cp -t drizzle x`.
- Document the guard's limits and add table-driven regression tests. TICKET-001's post-hook symlink fix remains separate.

## Acceptance criteria and evidence

- Temporary output Read requests succeed; `.env.local` and aliases to it remain denied.
- `grep -n process.env src/x.ts | sed -n 1p` succeeds. In-place secret edits and copies into protected migrations are denied.
- Tests cover these cases plus external writes, redirects, quoted command text, target-directory options, and symlink resolution.

## Verification

- Before implementation: regression suite demonstrated 12 failures and 21 passes.
- Original focused hooks/harness tests: 39 passed. After integrating develop: `pnpm verify:quick` passed with 58 related tests.
- Full `pnpm verify`: ticket validation (188 tickets), formatting, lint, types, 106 unit tests, production build, and 17 browser smoke passes; 7 existing skips.
- Used public local defaults from `.env.example`. No UI or production data changes. Interactive Claude tool integration was not exercised.

## Risks and rollout

Static inspection handles common commands; it does not interpret arbitrary shell programs or replace platform permissions and post-edit/staged checks. Complex command syntax may require explicit paths.

Updated against `develop` after TICKET-001 merged. Preserved its post-tool symlink handling and isolated Git test environments, retained both progress entries, and regenerated ticket boards from the current ticket records. Roll back this ticket’s implementation commit if its guard behavior causes regressions; retain TICKET-001’s fixes.
