# Ticket

TICKET-166: event closure and anonymous memories.

# Summary

After the event, an authenticated administrator can close ordering, revoke staff
and devices, and download anonymous counts/menu statistics as CSV or themed PDF.
This draft preserves admission evidence and excludes data deletion.

Independent review found and fixed an integration error: memories admissions now
sum canonical admitted people rather than historical check-in rows. Real database
regressions proved the former query missed partial arrivals and counted legacy
overflow. Both now pass without weakening assertions or admission guards.

## Changes

- Protected `/admin/event-closure` page linked from the control room, with typed
  confirmation and an initially unchecked scanner-evidence acknowledgment.
- Live AAL2 authorization at every mutation/download boundary. Closure refuses
  unknown timezone, premature requests and mismatched event details.
- Settings lock serializes closure with accepted orders. PIN material is cleared,
  staff/devices revoked, ordering closed; repeat closure makes no further changes.
- Read-only aggregate snapshot and allowlisted CSV/PDF serialization. Exports omit
  contacts, guest names and dietary notes; downloads use private no-store headers.
- Existing schema only; no new migration or production operation.

## Acceptance criteria and evidence

- Existing gate/kitchen/bar sessions are rejected after closure, even after restoring a future synthetic date to distinguish revocation from expiry: real authenticated rehearsal passed.
- CSV/PDF exports exclude names, contacts and dietary notes: aggregate/storage, serialization, native PDF and private-download tests passed.
- Premature closure is refused; repeated closure is idempotent and concurrent accepted orders are preserved. No admission evidence is deleted. Production timing and operator confirmation remain mandatory.

## Verification

Current 2026-11-09 integration against develop `360914b7`:

- Eight focused non-database suites / 53 tests pass. The integration quick gate
  passed lint, types and 324 related tests (89 skipped); final quick rerun after the canonical-count fix passes lint and types. Its two
  opt-in database cases are skipped in the quick command, but both passed in the
  explicit database run above. Final-head CI is still required.
- Both new memories regressions first failed against the old query: three accepted
  modern arrivals reported zero; two legacy archive rows with allowance one
  reported two instead of one. Summing guarded canonical counters fixes both,
  including the combined legacy-plus-modern total of four without double-counting.
- All 26 real database tests pass across closure, memories and ordering, including
  the ordering/closure race. Test fixtures and isolated backfill schemas roll back;
  no append-only guard is disabled or fixture history forcibly deleted.
- Current production build passes. The real authenticated closure rehearsal passes
  (1 test, 16 seconds): admin OTP/TOTP, all three staff sessions invalidated, retained
  admin access, early refusal, protected CSV/PDF downloads, all-theme AA/overflow,
  keyboard, reduced motion and exact-zero cold CLS.
- All 16 current screenshots are byte-identical to the prior reviewed captures;
  the ivory/gold 375px focused-control viewport was reinspected.
- Applied additive develop migrations only; 21 public tables retain RLS and repeat
  migration preserves every count. No reset or production closure occurred. The
  owned stack was stopped afterward with its backup preserved.

Historical full-gate/native-PDF evidence (not a new full local rerun):

- Full local gate: lint/types/format/build pass;1076 unit tests pass (99 conditional
  skips),851 browser checks pass (195 skips). Skips are not claimed as evidence.
- Explicit database suite:24 passes covering closure, memories and ordering.
  Additional concurrency rehearsal passes: closure visibly waits on PostgreSQL's
  lock until an accepted order commits, then rejects the next order without a write.
- Real local OTP/TOTP admin and all three staff-role browser sessions: closure,
  session rejection, retained admin access, early-disabled form and downloads pass.
- All four themes at375/768/1280:12 AA/overflow checks pass and screenshots inspected
  at `artifacts/TICKET-166/screenshots/`. Native PDFKit checks pass for all four
  themes and a seven-page menu, including A4 size, page numbers and privacy markers.
- Quick verification passes after the concurrency test. Full-gate evidence predates
  that test-only addition; required CI must be rechecked on the final review head.

## Remaining release checks

Keyboard/focus,44px targets, focused controls above mobile navigation, reduced motion
and exactly0 cold-load CLS at all three widths pass. All seven long PDF pages were
visually inspected. Physical-phone keyboard/safe-area and download checks remain;
the owner authorizes preview progress while these remain explicitly tracked in TICKET-201. No physical-device result is claimed.
See `docs/reviews/TICKET-166/ui-review.md` and the ticket handoff for exact evidence.

## Risks and rollout

Current integration base: develop `360914b7`. Review with the owned isolated
stack only: `pnpm exec tsx scripts/test-event-closure.ts` refuses existing staff or
devices, creates synthetic identities, and restores its exact fixtures/settings.

Production closure requires approved venue time and human confirmation that all
scanner queues are synced or safely exported. This PR does not authorize it.
Rolling back code cannot restore revoked credentials; recovery requires deliberate
admin reissuance, never resurrecting old PIN material. No evidence is deleted.
