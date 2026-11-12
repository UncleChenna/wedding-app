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

Draft: final combined verification and hosted CI remain pending. Implemented
criteria have focused and actual-browser evidence below. Conflict resolution UI
remains TICKET-067; expiry/logout recovery follow-up184 remains separate.

# Verification

-12 queue policy tests and10 real IndexedDB Chromium/WebKit cases passed.

- Actual emitted worker/store suite16cases and two persistent-browser cold restarts
  passed, covering held writes, lost response, barrier recovery and invalid QR.
  -13 real reconciliation DB tests passed, including concurrent/immutable retry and
  authority expiry after locking. Migration twice/count equality/RLS26 pass.
- Default/load seed repeatability2tests pass with guards restored.
- Authenticated mobile/desktop production browser2tests passed: ten admissions,
  reload after five, exactly ten canonical people from twenty immutable events,
  repeated sync with no increment, keyboard receipt focus and24axe/theme captures.
- Reviewer found stale waiting-copy after ACK; regression failed before correction
  and three component tests now pass. Final browser captures are being refreshed.
- CI parity passes. Additive existing-job steps preserve prior gates and timeouts.

# Risks and rollout

Apply0031 before new application code; rollback can leave its nullable column.
No existing evidence is rewritten or removed. See
[the migration review](../reviews/TICKET-066/migration-review.md) for limits and
isolated-only evidence. New staff/device identity must match the original queue
actor; another operator cannot silently upload or relabel pending records.

Offline admission cannot prevent simultaneous admissions on disconnected phones;
server reconciliation retains conflicts for067. Physical-device114/163/201 checks
remain mandatory. TICKET-081's200KB initial-wire budget is not certified here.
No production database, paid service, dependency or build permission changed.

# Screenshots

[Mobile screenshots](../reviews/TICKET-066/mobile/) and
[desktop screenshots](../reviews/TICKET-066/desktop/) contain four themes at375px
for count confirmation, local receipt and sync. Final copy refresh pending.

# UI checklist

Staff UI review uses the current lighter scope:375px captures, all-theme axe,
keyboard focus and retained camera/session behavior.24 original captures were
independently inspected without layout defects. Local receipt does not claim
canonical acceptance. Physical devices are unverified and remain release gates.

# Harness changes, if any

Existing camera and disposable-database journey jobs add scoped queue checks;
[CI proposal](../reviews/TICKET-066/ci-proposal.md). Full verification is selected
by shared-worker/schema paths under227; no checks or assertions are weakened.
