## Summary

Prove CI uses the full local verification gate and document all environment inputs. Existing GitHub CI is green; three CI-only variables were missing from the public example documentation.

## Changes

Document POSTGRES_PASSWORD, PR_TITLE and PR_BODY as comments rather than app runtime settings. Add regressions for declared CI variable documentation and the exact verify-job setup/command sequence. Update the historical claim that CI never ran. No CI workflow or permissions change.

## Acceptance criteria and evidence

All four required jobs passed on [PR #8](https://github.com/UncleChenna/wedding-app/pull/8), [run 39586928907](https://github.com/UncleChenna/wedding-app/actions/runs/39586928907). The verify job invokes exactly pnpm verify after dependency/browser/skill setup. Every declared workflow variable is now documented. This PR also runs all CI jobs; optional paid review remains intentionally disabled.

## Verification

New regression before the fix: 1 failed, 1 passed. Quick and full local gates passed: 106 unit tests, production build, 17 smoke passes, 7 existing skips. No UI change; screenshots N/A. No secrets read or changed.

## Risks and rollout

The parity test reflects the current explicit YAML job layout; intentionally changing setup commands requires updating its expectation. No deployment, dependencies or migration. Revert this ticket commit to roll back. Prerequisite harness/workflow changes are now merged into develop. Human review and merge only; branch protection remains TICKET-005.

## Integration verification

Updated against develop at cb365fe after PR #9 merged. Later PR merges can create fresh shared-file conflicts. Preserved both handoff histories, regenerated boards and retained prerequisite hook fixes. Quick and full verification passed: 110 unit tests, production build, 17 browser smoke passes and 7 existing skips.
