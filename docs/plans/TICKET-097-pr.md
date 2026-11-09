# TICKET-097: show live counters on the admin dashboard

Ticket: TICKET-097

## Summary

The control room’s “Live dashboard — Coming soon” placeholder is replaced with authenticated, automatically refreshed invitation, RSVP, arrival and order counts. Failed refreshes retain explicitly stale values; expired access clears them.

## Changes

- One PostgreSQL statement reads a consistent snapshot; only five validated numeric fields leave the server, without names or contacts.
- Invitations sent counts active sent/RSVP households, excluding draft/revoked invitations. RSVP yes counts accepted people; Arrived sums canonical admissions, including partial arrivals rather than scan attempts.
- Each guest order counts once across kitchen/bar. Station states determine open/served status; all-cancelled orders are excluded. Historical childless orders use parent status, including legacy ready as open.
- The private/no-store endpoint checks live two-factor admin access every time. Serial visible-tab polling uses a bounded request, abort/generation protection and manual refresh.
- Two compact mobile columns and three desktop columns reuse existing cards, buttons, fonts and theme tokens.
- The existing isolated admin CI journey adds real database and browser coverage, preserving its original tests, services and timeouts.

## Acceptance criteria and evidence

- **Correct totals:** two real PostgreSQL fixtures cover active/draft/revoked invitations, partial arrivals, split stations, cancellation, stale parent states and childless legacy orders. Fixtures roll back without disabling guards.
- **Admission update under two seconds:** hosted real OTP/TOTP browser tests passed. On responsive source `6a313ab5`, insertion-start to visible arrival was **993.8ms mobile / 994.9ms desktop**, including the database round trip. Both initial authenticated loads measured **CLS 0**.
- **Still required:** TICKET-061 merge, integration and final combined CI. This PR remains draft until those gates pass.

## Verification

- Quick gate: lint/types and 14 related tests pass after responsive changes.
- Full local unit suite: **1,745 passed / 187 conditional skips**; critical coverage 98.27% lines / 98.46% branches. This preceded the responsive-only refinement; final combined CI remains required.
- Isolated native PostgreSQL aggregate tests: **2/2**, also passing in the real Auth CI job. CI harness/parity regression: **15/15**.
- [Hosted run 42712187041](https://github.com/UncleChenna/wedding-app/actions/runs/42712187041): authenticated admin journey passed, including direct HTTP denial, aggregate projection, live updates, stale retention, real cookie-removal denial, keyboard refresh and all-theme axe checks. Full verification is still running.
- Independent source review found and resolved legacy-ready counting and offline-after-denial UI behavior. The latter was reproduced red then green. Final source and all 42 responsive images reviewed clean.

## UI checklist

| Check                    | Result and evidence                                                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Screenshots              | PASS: 42 independently reviewed images under `docs/reviews/TICKET-097/{mobile,desktop}`: four themes at 375/768/1280, stale states and scrolled phone views. |
| Tokens                   | PASS: no colour/font/shadow literals in changed UI; registered tokens and shared components.                                                                 |
| Restraint and typography | PASS: labelled numeric totals, 18px body/control text, display-serif headings and numbers.                                                                   |
| Mobile                   | PASS: overflow/44px target checks; scrolled RSVP/arrival totals clear fixed navigation.                                                                      |
| Motion                   | PASS: reduced-motion browser checks; no new animation.                                                                                                       |
| Keyboard                 | PASS: focus and Enter refresh in every theme/width; no new dialog.                                                                                           |
| Contrast                 | PASS: axe in all four rendered themes; status meaning uses text.                                                                                             |
| Load and images          | PASS: authenticated initial CLS0 in both projects; existing local fonts unchanged, no UI images added.                                                       |
| Performance              | N/A under admin-only TICKET-217 scope; guest Lighthouse gate unchanged. Update latency measured above.                                                       |
| Copy                     | PASS: explicit households/people/order meanings and plain stale/sign-in guidance.                                                                            |
| Shared components        | PASS: existing Card/Button/admin shell; no new general-purpose pattern.                                                                                      |
| Sharing and devices      | N/A under admin-only checklist scope; guest sharing unchanged. Physical devices not tested or claimed.                                                       |
| QR codes                 | N/A: no QR output or scanner changes.                                                                                                                        |
| Staff feedback           | PASS: immediate refresh wording; expiry shows sign-in and failed reads show stale values.                                                                    |
| Verification             | PENDING: final combined CI after TICKET-061 integration.                                                                                                     |

## Review, risks and rollback

Sign in at `/admin` with an allowed address and two-factor authentication. Check all five counts, record an admission and watch Arrived update without reloading. Disconnect for explicit stale values; reconnect or refresh. Sign out to verify counts disappear.

Polling reflects committed server data; unsynced offline admissions appear only after upload. The measured result is test evidence, not a guarantee during network outages. Failed reads never become zero. All aggregates remain admin-only.

Base: develop `143b4d63`; TICKET-061 integration outstanding. No schema, RLS, production database, dependency or external-service change. Rollback reverts this ticket’s endpoint, presentation and tests; stored event data is unchanged.
