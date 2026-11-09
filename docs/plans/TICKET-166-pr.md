# Ticket

TICKET-166: event closure and anonymous memories.

# Summary

After the event, an authenticated administrator can close ordering, revoke staff
and devices, and download anonymous counts/menu statistics as CSV or themed PDF.
This draft preserves admission evidence and excludes data deletion.

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

Current 2026-11-09 integration: merged develop `fffe7b8d` without conflicts, preserving current admin navigation and ordering logic. All eight focused non-database suites / 53 tests pass. The quick gate passes lint, types and 324 related tests (89 skipped). New-head CI remains pending. Database and browser reruns are queued until the shared verification slot is available; the prior results below are explicitly historical evidence. No database was started or mutated during this integration.

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

## Remaining integration work

Keyboard/focus,44px targets, focused controls above mobile navigation, reduced motion
and exactly0 cold-load CLS at all three widths pass. All seven long PDF pages were
visually inspected. Physical-phone keyboard/safe-area and download checks remain;
the owner authorizes preview progress while these remain explicitly tracked in TICKET-201. No physical-device result is claimed.
See `docs/reviews/TICKET-166/ui-review.md` and the ticket handoff for exact evidence.

## Risks and rollout

Current integration base: develop `fffe7b8d`. Review with the owned isolated
stack only: `pnpm exec tsx scripts/test-event-closure.ts` refuses existing staff or
devices, creates synthetic identities, and restores its exact fixtures/settings.

Production closure requires approved venue time and human confirmation that all
scanner queues are synced or safely exported. This PR does not authorize it.
Rolling back code cannot restore revoked credentials; recovery requires deliberate
admin reissuance, never resurrecting old PIN material. No evidence is deleted.
