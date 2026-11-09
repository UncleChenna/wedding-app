# Ticket

Ticket: TICKET-048

# Summary

Guests who lose their invitation can request help at `/lost-link`. The same neutral
receipt is returned whether a guest matches or not. Authenticated admins review
requests at `/admin/link-requests` and re-share through the existing Share menu;
nothing is sent automatically.

# Changes

- Validated private request storage, RLS enabled with no browser policies.
- Approved separate budget of 10 requests per trusted network per minute; existing
  lookup/PIN budgets unchanged. Shared networks share this allowance.
- AAL2-protected queue, conservative unique matching and pagination. Sharing uses
  the exact invitation ID/version and records the copy event through existing APIs.
- Validation and retry responses preserve bounded input, including without JavaScript.
- Integrated develop 5338f85d, preserving migrations0023/0024 and regenerating this
  additive migration as0025. Corrected admin text to the required18px.

# Acceptance criteria and evidence

- Identical matched/unmatched receipts: real mobile/desktop browser tests compare
  responses and assert no public invitation bearer link is exposed.
- Requests appear privately with a unique suggested match: real local OTP/TOTP
  admin journey and database persistence tests. Signed-out access redirects.
- Re-sharing uses ShareMenu: actual copied URL and persisted share event asserted;
  keyboard Enter opens the dialog and successful copy restores trigger focus.

# Verification

- Quick gate: lint/types and378 related tests pass,143 environment skips.
- Production build passes. Real database suite4/4 passes; repeat migration leaves
  counts unchanged and all24 public tables retain RLS.
- Real authenticated mobile/desktop and native no-JavaScript journeys4/4 pass;
  final capture journey2/2 passes. Initial form/CLS suite15/15 passes.
- All52 fresh screenshots inspected, AA across four themes and required widths;
  44px targets, intermediate widths, reduced motion and keyboard checks pass.
- Guest/admin cold CLS0 at375/768/1280. Three fresh Lighthouse mobile runs each
  Performance100/Accessibility100/CLS0; timestamped performance.json committed.
- Regressions first reproduced16px admin text and missing share tracking, then
  passed after fixes. An intermediate capture correctly hit the10/minute limit;
  retry after actual expiry passed without resetting or weakening the budget.
- Independent source/migration and mobile queue review found no blocker.
- All six checks passed at8b09e7a8 (run42668969768). The later test-only PR143 base update is integrated; combined-head CI is pending. Old full gate results
  in the handoff are historical, not certification of this integrated head.

# Risks and rollout

Migration0025 adds the request table and expands the rate-budget scope check; old
lookup/PIN values stay allowed. Generated SQL matches the previous approved lost-link
SQL. Only owned synthetic048 data was reset after aggregate confirmation;26 entries
apply and repeat cleanly. No production application. Roll back application code while
retaining the additive table; do not erase collected requests or edit applied SQL.
Submitted contacts remain subject to the90-day post-event retention requirement.
Matching is a suggestion, not identity proof; admins must verify before sharing.
Physical iOS/Android WhatsApp, keyboard and safe-area checks remain unverified in
release-blocking TICKET-201 under standing preview authorization. No release approval
or physical-device pass is implied. Owned database stopped with backup preserved.

# Screenshots

All52 reviewed captures: [screenshots](../blob/TICKET-048/docs/reviews/TICKET-048/screenshots).
Four themes ×375/768/1280 × form/invalid/received/admin queue, plus four scrolled
375px queue views proving the share action clears fixed navigation.

![Guest form](../blob/TICKET-048/docs/reviews/TICKET-048/screenshots/form-ivory-gold-375.png)
![Admin sharing](../blob/TICKET-048/docs/reviews/TICKET-048/screenshots/admin-lower-ivory-gold-375.png)

# UI checklist

- [x] Screenshots: all52 fresh captures inspected; paths above.
- [x] Tokens: existing shared theme tokens; no literal colours/fonts added.
- [x] Restraint and typography: bounded single column,18px admin body, readable wrapping.
- [x] Mobile: browser overflow/44px/intermediate-width checks pass; physical checks retained below.
- [x] Motion: reduced-motion checked; no custom animation introduced.
- [x] Keyboard: labels, Tab/Enter and Share dialog focus return pass.
- [x] Contrast: AA axe across actual states and all themes; textual error meaning.
- [x] Load and images: guest/admin cold CLS0; existing fonts; no new imagery.
- [x] Performance: production mobile100 performance/100 accessibility, three runs.
- [x] Copy: Warm neutral receipts and bounded human errors.
- [x] Shared components: Input, Button and ShareMenu reused.
- [ ] Sharing and devices: real phones/WhatsApp remain TICKET-201 release gates.
- [x] QR codes: N/A, QR output unchanged.
- [x] Staff feedback: N/A, no scanner/station feedback changes.
- [ ] Verification: current full CI pending; no pass claimed.

# Harness changes, if any

No harness change. Browser fixtures use fresh synthetic admin prefixes and distinct
artifact directories; no assertions, hooks, coverage thresholds or timeouts weakened.
Detailed current and historical results: docs/handoffs/TICKET-048.md and
docs/reviews/TICKET-048/ui-review.md.
