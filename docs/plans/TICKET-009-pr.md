## Summary

Prove THM-3 at the theme loader and registry-import boundaries. Existing production behavior already rejects inaccessible themes; this ticket strengthens the evidence without changing the palette.

## Changes

Add explicit assertions for the theme identity and all 11 failing token pairs in the low-contrast fixture, including text and control thresholds. Verify registry import rejects an inaccessible registered theme. Clarify the copy/edit/register/check instructions.

## Acceptance criteria and evidence

Both regression tests pass. A temporary sage-garden JSON copied from ivory-gold was edited and registered using the guide; the documented command passed. Setting its foreground equal to background then failed registry loading with sage-garden named. Temporary files were removed. No new preset is shipped.

## Verification

`pnpm verify:quick` passed. `pnpm verify` passed: 188 tickets, format, lint, types, 106 unit tests, production build, 17 smoke passes and 7 existing skips. No UI change; screenshots are not applicable.

## Risks and rollout

Test-only registry mocks are reset after each test. No runtime changes or migration. Revert the ticket implementation commit to roll back. Prerequisite harness/workflow changes are now merged into develop. Human review remains required.

## Integration verification

Updated against develop after TICKET-001 and TICKET-002 merged. Preserved both handoff histories, regenerated boards and retained prerequisite hook fixes. Quick and full verification passed: 108 unit tests, production build, 17 browser smoke passes and 7 existing skips.
