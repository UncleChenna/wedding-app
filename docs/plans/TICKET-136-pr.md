## Summary

Exercise the actual disconnected gate journey with two independently authenticated scanners and 50 QR scans. Both scanners keep their original event IDs across offline reloads, then reconcile a shared four-person household without losing the eight reported arrivals or admitting more than four.

## Changes

- Add `e2e/offline-gate.spec.ts`, using generated signed QR pixels through the real camera decoder, real staff PIN sessions, service workers, IndexedDB and the authenticated sync endpoint.
- Give each scanner 25 scans: one shared household and 24 separate households. Read and validate the real journal without altering it, compare it across reloads, and replay its original upload bodies after successful synchronization.
- Extend the existing offline-queue runner, already executed by CI, to include this scenario. Existing product and fault tests remain intact.
- Retire only synthetic staff/device credentials after testing; retain append-only observations/admissions. No product behavior, migration or dependency changes.

## Acceptance criteria and evidence

- Two disconnected scanners: 50 QR scans create 100 observation/admission records. All original IDs persist exactly across reloads and synchronization. Replayed uploads create no additional rows or admissions.
- Shared allowance: eight reported arrivals, four canonical admissions, one retained conflict. Across all households: 56 reported, 52 admitted; counters agree with immutable rows.
- Existing Chromium/WebKit worker/store tests cover durable evidence, quota failure, lost acknowledgements, expiry, partial eviction and interrupted upgrades. Existing policy tests cover malformed/stale authorization and invalid observations. These suites are reused rather than replaced by weaker duplicated checks.
- Exact synthetic totals: `docs/reviews/TICKET-136/{mobile,desktop}-reconciliation.json`.

## Verification

- Production build passes on base `4b37377599afd4030e310058d56734fa1e8dc587`.
- New mobile/desktop actual offline flow: 2/2 pass.
- Existing offline queue browser fault suites: 40/40 pass across Chromium/WebKit.
- Existing offline queue/snapshot policy tests: 33/33 pass.
- `pnpm verify:quick`: lint and types pass; runner-only change has no related unit tests.
- Initial fixture mistakes (device table name and exact readiness text) were corrected; no product assertions, limits or checks were relaxed.

## Risks and rollout

This is automated browser verification using synthetic QR camera pixels, not physical camera/device certification. Real phones remain TICKET-163 and existing release gates. The test uses an isolated disposable PostgreSQL database, not production. Rollback removes only the new test and runner entry. The shared conflict is preserved for the existing admin dispute workflow; this ticket does not add or change that workflow.
