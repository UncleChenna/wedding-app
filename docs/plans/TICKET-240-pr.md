# TICKET-240: Reduce worker update validation bundle with strict guards

## Summary

The shared worker-update client imported Zod’s complete namespace for three reply states. It now uses named imports from the already installed Zod Mini package. Strict unknown-key rejection, discriminated states, safe positive integer counts and fail-closed behavior remain unchanged; activation, queue locking and reload logic are untouched.

## Changes

Use named Zod Mini schema constructors and add protocol boundary regression cases. Publish reproducible byte counts without changing dependencies or queue behavior.

## Acceptance criteria and evidence

- The original and replacement validators both pass the same 26 update-client tests, including extra fields, nonfinite/fractional/unsafe counts, valid integer boundaries and queue/reload safety.
- Standalone esbuild browser-module output falls from 456,601 to 20,941 minified bytes, or 93,478 to 7,225 gzip bytes. Exact command and counts are in `docs/reviews/TICKET-240/bundle-sizes.json`. These are isolated module measurements, not Next chunk sizes or proof of a Lighthouse score. TICKET-116 retains the actual post-hero page baseline and unchanged 95 target.
- `pnpm verify:quick`: lint, types and all 26 related tests pass.
- Independent source review found no blocking issue.

## Verification

`pnpm verify:quick` and the 26-test worker update suite pass; the same suite passed before changing the parser. Independent review found no blockers. Existing browser update tests remain in CI.

## Risks and rollout

Compare the schema declarations and boundary tests; rerun the esbuild command against the parent source and current source. No new dependency, lockfile, migration, visual change or permission flow is introduced. Existing browser update coverage remains in CI. Physical-device and final page-speed evidence are not claimed here.

### Rollback

Revert this ticket’s source and tests to restore the prior validator import. No stored data or protocol changes require migration.
