# Ticket

TICKET-061 — Admit arriving guests with partial counts.

# Problem and result

A valid pass check previously recorded no arrival. Staff can now select how many household members are here and explicitly admit them. Admitting2 of 4 leaves2available on the next scan. Only a committed receipt displays Welcome; retrying the same request displays a historical receipt and never grants a second admission.

# Changes

- Strict same-origin/auth-first POST validates the request and signed pass before reading guest data. Staff/device/credential and invitation locks, plus live reauthorization after waits and immediately before writing, protect the current allowance.
- Immutable online events bind retries to actor, invitation and count. Existing database triggers update canonical counters exactly once. No schema/migration change.
- Large count stepper defaults to remaining places. An uncertain response preserves the exact request and locks Scan next pass until retry resolves. Concurrently consumed places produce a clear refusal.
- Camera start appears before the idle viewfinder. Receipt focus supports keyboard use. Scanner remains free of Next server-action imports for the separate offline shell.
- Existing CI's disposable database job gains transaction concurrency and authenticated partial-admission browser checks; no check or timeout is weakened.

# Acceptance criteria and evidence

- Partial2 of 4 and second scan with2 remaining: actual production browser on mobile and desktop.
- Idempotency: pure request binding tests, actual concurrent SQL transactions, and real committed-but-lost-response browser retry all preserve one event per intent.
- Over-admit refusal: actual competing scanner database tests and browser stale-read/final-place case.
- Independent backend review: no blocking finding. Independent UI/final review pending; draft retained.

# Verification

Base develop:2df977c6a1445e01da27f11b43637dcae7dc6bba.

- Quick: lint/types pass;55 related unit tests pass,5 conditional database skips.
- Isolated PostgreSQL16 database tests:5/5 pass, including real invitation lock wait and session expiry. Unchanged migrations applied to a proven empty owned cluster; synthetic append-only evidence preserved.
- Production build passes.
- New authenticated browser journey:2/2 pass33.0s, including receipt focus and reduced motion. Four themes×375/768/1280, axe0, no overflow,44px targets.
- Full unit first run:1673pass,190conditional skips, one failure requiring documentation for the new CI flag. Documentation added; unchanged CI parity tests now2/2 pass. Coverage passed98.30%lines/98.51%branches with unchanged per-file95 thresholds. Final full rerun pending.
- Existing camera regression and final integrated CI pending.

# Screenshots and review

144 synthetic screenshots under docs/reviews/TICKET-061/{mobile,desktop}/: choose-count,recorded,uncertain,duplicate,refused in every theme and three widths. Review the ivory375 count selector and green committed receipt, then amber duplicate and uncertain retry. No live guest tokens or private guest notes are captured.

# Risks, limitations and rollback

TICKET-108 must merge before final base integration. This implements online admission only; persistent offline snapshots/outbox remain separate tickets. Physical iOS/Android camera and event conditions remain TICKET-201 release gates, not certified here. No production database application. Reverting the application changes disables this new write endpoint; existing immutable scan events remain valid and must not be deleted.

## Review repairs — 2026-11-09

- A stalled transport is bounded to eight seconds, including response-body consumption. Headers/body stall regressions preserve the original intent for retry; unmount aborts transport and removes the timer.
- Independent review reproduced a phone visibility bug: clearing the result could discard an unresolved admission ID. The scanner now stops capture/audio while keeping the admission component mounted. A scanner-level red/green regression and actual committed-then-lost-response browser case prove hidden/visible transitions preserve the same request.
- Invalid, revoked, conflict and expired-session submit results use fixed danger colours and a cross icon; already-used and waiting cases remain amber. A revoked-after-check browser case covers every theme.
- Final scoped quick passes lint/types and18 related tests. Actual production browser2/2 passes 33s. Existing unchanged camera regression2/2 passes 1.2m. The full unit rerun before the visibility repair passed 1677 tests with 190 conditional skips; coverage 98.30% lines / 98.51% branches. Final integrated suite remains required after TICKET-108.
- Owned native PostgreSQL 36261 is stopped with its synthetic data directory preserved; the database slot was released to TICKET-123. No production operation.

## Independent final review

2026-11-09: backend review and separate UI review are clean at source e26b9b16. The UI reviewer inspected all 144 state screenshots and confirmed the visibility/intent and fixed-status repairs. No remaining material source or visual finding. This does not certify physical devices; final TICKET-108 integration and final-head CI remain outstanding.
