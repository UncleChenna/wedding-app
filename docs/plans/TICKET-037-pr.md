# Ticket

TICKET-037 — Build the IV page with names, date, venue, dress code and map.

# Summary

Personal invitations previously hard-coded couple/date details and omitted venue, dress code and maps. They now render saved settings, approved warm wording and a keyboard-operable reply anchor. Undecided details remain clearly pending.

# Changes

- Server-rendered InvitationLetter with date-only formatting independent of visitor timezone and validated HTTPS venue maps.
- Real RSVP form retained, including native no-JavaScript submission, token authorization and saved replies.
- Conditional pass slot/anchor; owner-approved split keeps real returning-guest signed-pass integration mandatory in TICKET-044.
- Labelled /dev/invitation/letter preview linked from /dev, with four themes and optional clearly labelled sample arrangements.
- Deliberate headline sentence breaks and left-aligned letter copy eliminate measured cold-load font movement without hiding content.

# Acceptance criteria and evidence

All local functional criteria are verified: four themes at375/768/1280,44px link targets, keyboard navigation, reduced motion, axe checks, long-name wrapping, safe map destinations and unobscured reply actions. All12 preview screenshots and60 actual RSVP state screenshots inspected. Additional16 intermediate-width checks pass.

Owner explicitly approved two exceptions: physical WhatsApp/native-map verification and remaining performance variability are mandatory in release-blocking TICKET-201. They are not marked passed. Real signed-pass functionality remains in TICKET-044; no placeholder pass is shown.

# Verification

- pnpm verify: PASS — formatting, lint, types,471 unit tests (22 skipped), production build and525 browser tests (135 skipped).
- pnpm verify:quick: PASS; focused component tests4 PASS.
- Targeted browser review:25 PASS, including12 live-state cases producing60 captures.
- Earlier isolated real-data tests:6 RSVP persistence/authorization checks and2 configured-details/no-JavaScript checks passed.
- pnpm t:validate:207 tickets valid.
- Mobile Lighthouse on authorized synthetic personal invitation: final serial Performance94/98/95 (median95), Accessibility100/100/100, CLS0/0/0. Earlier90/95/98 scores retained. Below-target results remain a TICKET-201 release gate.
- Physical iOS/Android WhatsApp and native map handoff: NOT VERIFIED, owner-approved tracking in TICKET-201.

Integrated develop base5bd56a82d37942a1a046fc1b1c93c22f2a6829bc. CI must pass on the final PR head before merge.

# Risks and rollout

Production venue/time/timezone/dress code remain TBD; RSVP activation remains guarded by timezone availability. No authentication, RLS, dependency or new migration change. Existing migration files arrived unchanged from merged develop with exact-path owner authorization. Revert the ticket's application changes to restore the previous layout; no database rollback required. Device/performance exceptions permit review, not guest release.

# Screenshots

[Full review and screenshot directory](../reviews/TICKET-037/README.md): four themes ×375/768/1280; preview originals plus live initial/yes/no/error/closed states. Contact-sheet padding is not application whitespace; outlines show keyboard focus.

# UI checklist

The item-by-item report is in docs/reviews/TICKET-037/README.md. Automated layout/accessibility/copy/motion checks pass; measured CLS is0. Performance consistency and physical device/native-map verification remain explicit approved exceptions in TICKET-201. QR and staff feedback are not applicable to this change.

# Review steps

Visit /dev, choose Personal invitation layout, switch themes and use Kindly reply with the keyboard. Visit /dev/invitation/letter?details=sample for clearly labelled configured map/time details. Test saved replies only with an authorized synthetic invitation in an isolated database; no personal tokens are included here.
