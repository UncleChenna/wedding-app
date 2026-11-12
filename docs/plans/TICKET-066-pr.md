# Ticket

Ticket: TICKET-066

# Summary

An offline scanner can now explicitly save an entry only after its immutable
attempt commits to IndexedDB. The original authenticated operator uploads those
records on reconnect; repeated or uncertain retries cannot count an entry twice.
A local receipt is clearly separate from canonical server acceptance.

# Changes

- Worker-owned durable journal, transactional allowance checks, original actor
  binding and retained rejected/conflict evidence. Logout and private-cache expiry
  never delete pending records. Fresh canonical snapshots retire only captured
  acknowledgement barriers, including safe operator changes.
- Version2 private snapshots add server-verified actor IDs; version1 stays
  read-only. Worker verifies QR signatures itself and rechecks authority after
  asynchronous work. Manual selections require an existing snapshot invitation;
  signed unknown QR passes require an explicit name check under ADR0020.
- Count confirmation, local receipt focus, visible pending/operator/conflict
  counts, foreground retry and manual retry without Background Sync. Quota or
  uncertain writes never show admission success and retain the exact retry UUID.
- Same-origin actor-bound uploads reauthorize after lock waits. Generated0031
  adds a nullable canonical intent digest, preventing changed-version or changed
  unknown-invitation replay. Historical NULL-digest rows retain older comparison.
- Public-only crypto helper is installed as a service-worker script resource for
  real offline cold starts. Named Zod mini imports preserve strict validation and
  reduce the measured helper to roughly20KB gzip; its bytes remain counted by081.

# Acceptance criteria and evidence

All four implementation criteria are covered by the checks below. Final hosted CI remains pending; no merge or release certification is claimed. Conflict resolution UI
remains TICKET-067; expiry/logout recovery follow-up184 remains separate.

# Verification

-12 queue policy tests and10 real IndexedDB Chromium/WebKit cases passed.

- Final actual emitted worker/store suite:18 Chromium/WebKit cases pass, including two persistent-browser cold restarts, held writes, lost response, barrier recovery and invalid QR.
  -13 real reconciliation DB tests passed, including concurrent/immutable retry and
  authority expiry after locking. Migration twice/count equality/RLS26 pass.
- Default/load seed repeatability2tests pass with guards restored.
- Final authenticated product browser:2/2 pass (18.2s), nine QR plus one manual admission, reload after five, exactly ten canonical people from twenty immutable events, repeated sync with no increment, receipt focus and24all-theme axe captures.
- Existing snapshot revocation/expiry/sign-out compatibility2/2 pass (42.3s); manual uncertain-retry/camera recovery2/2 pass (32.0s). Manual checks now assert exactly one online and one newly synced offline zero-person observation before any positive admission.
- Reviewer found stale waiting-copy after ACK; regression failed before correction
  and three component tests pass. Final browser captures confirm the corrected copy. A deferred observation regression also reproduced and fixed stale green verdicts; both QR/manual paths compare the worker verdict and preserve generation fences.
- CI parity passes. Additive existing-job steps preserve prior gates and timeouts.

# Risks and rollout

Apply0031 before new application code; rollback can leave its nullable column.
No existing evidence is rewritten or removed. See
[the migration review](https://github.com/UncleChenna/wedding-app/blob/TICKET-066/docs/reviews/TICKET-066/migration-review.md) for limits and
isolated-only evidence. New staff/device identity must match the original queue
actor; another operator cannot silently upload or relabel pending records.

Offline admission cannot prevent simultaneous admissions on disconnected phones;
server reconciliation retains conflicts for067. Physical-device114/163/201 checks
remain mandatory. TICKET-081's200KB initial-wire budget is not certified here.
No production database, paid service, dependency or build permission changed.

# Screenshots

[Mobile screenshots](https://github.com/UncleChenna/wedding-app/tree/TICKET-066/docs/reviews/TICKET-066/mobile) and
[desktop screenshots](https://github.com/UncleChenna/wedding-app/tree/TICKET-066/docs/reviews/TICKET-066/desktop) contain four themes at375px
for count confirmation, local receipt and sync. All24captures are from the final combined product run.

# UI checklist

Staff UI review uses the current lighter scope:375px captures, all-theme axe,
keyboard focus and retained camera/session behavior.24 original captures were
independently inspected without layout defects. Local receipt does not claim
canonical acceptance. Physical devices are unverified and remain release gates.

# Harness changes, if any

Existing camera and disposable-database journey jobs add scoped queue checks;
[CI proposal](https://github.com/UncleChenna/wedding-app/blob/TICKET-066/docs/reviews/TICKET-066/ci-proposal.md). Full verification is selected
by shared-worker/schema paths under227; no checks or assertions are weakened.

## Verification history and remaining limits

Two earlier first-offline mobile attempts reported Camera stopped; desktop
continued. Privacy-bounded failure diagnostics now record only static asset paths
and controller/online booleans. The final combined run passes, but no root cause
or product fix is claimed for those earlier intermittent failures. Hosted Linux
checks remain required. A separate fixture failure from repeated synthetic names
was fixed with unique per-invitation names, not by selecting an arbitrary match.

Verified063/068 are integrated through develop d6fc777c. The new reauthorization
callback is supplied by the incoming isolated broadcast fixture; production
authority checks remain unchanged. Native local PostgreSQL does not certify
Supabase Realtime; its existing hosted gate remains mandatory. Owned29341 is
stopped with its synthetic data directory retained.

## UI checklist evidence

| Item                                   | Result and evidence                                                                                                                                                                               |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Screenshots, tokens, restraint, mobile | PASS:24final375px captures across four themes; shared tokens,18px body/control text, existing large Button/Input targets; reviewed wrapping and reachable controls. Staff scope applies.          |
| Keyboard and copy                      | PASS: Enter submits explicit count; receipt receives focus only after durable confirmation; uncertain retry freezes identity/count. Corrected historical receipt copy is asserted after real ACK. |
| Contrast and semantics                 | PASS: all24state/theme axe scans have no violations; results use words and icons, not colour alone.                                                                                               |
| Motion                                 | N/A: no new animation or timed visual transition; existing camera feedback is preserved.                                                                                                          |
| Images/fonts and CLS                   | No new images/fonts. Fresh CLS measurement is not certified by this queue run; existing release gate201 remains.                                                                                  |
| Performance                            | Not certified: eager public verifier adds measured worker bytes. Initial-wire budget remains081; no95Lighthouse or200KB claim.                                                                    |
| Shared components                      | PASS: existing Button/Input and scanner result components reused; local receipt is a feature-specific confirmation.                                                                               |
| Sharing/devices/QR output              | Sharing and QR generation N/A for this staff queue change. Real phones remain unverified under114/163/201; automated Chromium/WebKit checks are recorded separately.                              |
