# TICKET-048: Let guests request their link again

Guests who lose an invitation can submit their name and contact at `/lost-link`.
The public response never reveals whether they match a guest. Authenticated admins
see requests at `/admin/link-requests`, review possible matches, and re-share through
the existing Share menu. Nothing is sent automatically.

## Changes

- Validated, private request storage with RLS enabled and no browser policies.
- Approved separate limit of 10 submissions per trusted network per minute;
  existing lookup/PIN limits unchanged. Shared networks share this allowance.
- AAL2-protected queue with conservative matching, pagination and ShareMenu reuse.
- Validation/retry responses preserve bounded submitted fields, including without
  JavaScript. Successful receipts do not echo fields or expose invitation links.
- Admin keyboard regression covers all six navigation links.

## Acceptance evidence

All three functional criteria pass in real local browser journeys: matched and
unmatched submissions receive identical receipts; requests appear in the private
queue with the correct unique match; re-sharing copies the correct invitation URL
through ShareMenu. Signed-out admin access redirects to sign-in; verification uses
real local OTP and TOTP, with synthetic records cleaned up by exact identifiers.

## Verification

- Full `pnpm verify`: 1,061 unit tests passed (100 opt-in skips), production build,
  895 browser tests passed (201 opt-in skips), format/lint/types/ticket validation.
- Separate isolated database suite: four passes covering persistence, constraints,
  RLS, ten-request boundary, lookup/PIN independence and expiry reset.
- Real mobile/desktop authenticated journeys pass. Final desktop follow-up: two
  passes including native no-JavaScript validation and retained field values.
- Cold admin queue CLS is exactly zero at 375/768/1280 in fresh browser contexts.
- Initial, invalid, received and queue screenshots cover four themes at
  375/768/1280; AA/overflow checks pass. Lower mobile slices show the share button
  clear of fixed navigation; intermediate queue widths also pass.
- Prior serial guest-page Lighthouse: performance/accessibility 100 in all three
  runs, CLS zero. Default-theme fallback was logged; custom persisted theme
  selection is outside this evidence.
- Screenshots and checklist: `docs/reviews/TICKET-048/`. Full evidence and failed
  intermediate attempts are retained in `docs/handoffs/TICKET-048.md`.

Physical iOS/Android WhatsApp, keyboard and safe-area checks remain unverified.
A preview exception retaining TICKET-201's release gates is requested, not assumed.
The PR stays draft; no production-readiness or physical-device pass is claimed.
Check current-head CI independently before review/merge.

## Migration, rollout and rollback

Base: develop c9c9e66010ee773189477139d4f8b0d30cf481e1. The user approved generated
0013_lost-link-requests.sql and its snapshot/journal for isolated testing and commit.
Applied locally; repeat migration has identical counts (14 journal entries), and
all 17 public tables retain RLS. No production application is authorized.
PR99 and PR104 independently use migration number0013: integrate sequentially and
reconcile with approved tooling; never overwrite an already applied migration.
Application rollback can retain the additive request table. Submitted contacts are
personal data covered by the 90-day post-event retention requirement; no destructive
cleanup is included. No automatic message sending, new service or CI change.
