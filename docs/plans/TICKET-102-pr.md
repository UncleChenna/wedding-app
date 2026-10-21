## Summary

Choose the service-worker approach before implementing PWA caching. ADR 0014 proposes a small custom worker with explicit public-route allowlists and application-owned private offline data.

## Changes

Compare installed Next 16.4.2 guidance and Serwist's Turbopack integration. Record version, alternatives, update/rollback policy, privacy boundaries and downstream owners. Add a reproducible disposable prototype in spikes/pwa; it temporarily serves synthetic fixtures, builds the app and tests Chromium offline behavior. No dependencies or production registration are added.

## Acceptance criteria and evidence

ADR documents the decision and rejected alternatives for review. Clarified the old merged-ADR criterion: review readiness precedes human merge, and done still requires that merge. Prototype builds with pnpm build and passes registration, precache, runtime caching, offline reload and cache-entry checks. Worker is 1,494 bytes (643 gzip); static output stays 1,373,288 bytes. Sequential builds took 9,184ms and 4,817ms; these warm-cache observations are not a performance benchmark.

## Verification

`node spikes/pwa/verify.mjs` passed and cleaned its temporary public files. Quick gate and full `pnpm verify` passed: 104 unit tests, production build, 17 smoke passes, 7 existing skips. No product UI change; screenshots N/A. Real devices, root-scope production routing and update/outbox migration remain unverified downstream work.

## Risks and rollout

Custom cache logic and asset-manifest generation require maintenance and explicit route tests. Prototype scope is synthetic and does not prove production privacy or offline guest/scanner flows. ADR remains proposed until human merge. Prerequisite harness/workflow changes are now merged into develop. No deployment or migration; reverting the ticket commit removes the proposal and experiment.

## Integration verification

Updated against develop after TICKET-001 and TICKET-002 merged. Preserved both handoff histories, regenerated boards and retained prerequisite hook fixes. Quick and full verification passed: 106 unit tests, production build, 17 browser smoke passes and 7 existing skips.
