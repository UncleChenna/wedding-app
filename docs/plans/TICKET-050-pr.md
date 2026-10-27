# Ticket

Ticket: TICKET-050

# Summary

Add the invitation Share menu: WhatsApp and email drafts, copy-link confirmation with fallbacks, and native sharing when supported. A sample-only /dev/share page, linked from /dev, makes the feature reviewable without exposing guest data.

# Changes

- Validated URL builders normalize phone numbers and encode Unicode, line breaks and recipient fields; invalid input returns a readable error.
- Reuse the responsive Sheet, Button, Input and Toast components. Copy uses Clipboard API, then a legacy copy attempt, then visible manual selection.
- Feature-detect native sharing; invoke it directly from a click, treat cancellation quietly, and show recovery for failure.
- No automatic sending, sent-status writes, dependencies or migrations. Production guest-list integration remains separate; wording is TICKET-052 and sent tracking TICKET-051.

# Acceptance criteria and evidence

- WhatsApp/mail URLs: 17 unit cases cover emoji, line breaks, contact normalization and unsafe input.
- Native visibility/copy feedback: browser tests cover supported/unsupported native sharing, success/cancellation/error, real Chromium clipboard readback and both fallback levels.
- Keyboard/375px: Enter, focus wrapping, Escape and focus return pass; axe, target sizes and overflow pass in both themes at 375/768/1280 and manual copying works at 375x568.

# Verification

Full pnpm verify passed: 359 unit tests, 10 opt-in database skips, production build and 207 browser passes with 29 conditional skips, no retries. Added a separate production CLS test (0) after that run; final t:pr gate will include it. Quick gate passes. 15 focused production browser tests and 12 screenshot captures pass.
Base: bc15aa088fc27164e0108ab9fb17dc313d3ae0ec.
Logs: .harness/t050-verify.log and .harness/t050-screenshots.log.

# Risks and rollout

Physical WhatsApp/iOS/Android/mail-app verification and real native message delivery are not verified; native tests use mocks. Preview merge with remaining device QA tracked in TICKET-201 is explicitly authorized. No guest page changes or Lighthouse score claim. The sample page uses example.com, not a real invitation. Caller must supply an authorized invitation in future admin integration. Revert this UI/helper change to roll back; no data migration.

# Screenshots

[UI review and all 18 screenshots](https://github.com/UncleChenna/wedding-app/blob/TICKET-050/docs/reviews/TICKET-050/README.md)

![Ivory mobile menu](https://github.com/UncleChenna/wedding-app/blob/TICKET-050/docs/reviews/TICKET-050/ivory-gold-375-sheet.png)
![Dark mobile menu](https://github.com/UncleChenna/wedding-app/blob/TICKET-050/docs/reviews/TICKET-050/midnight-champagne-375-sheet.png)

Review at /dev/share, open the menu, try keyboard navigation/copy, then switch themes. pnpm dev uses worktree port 22610.

# UI checklist

See the linked review for every PASS/N/A/NOT VERIFIED entry. Automated accessibility/layout/interaction checks and screenshot inspection pass. Physical-device sharing remains explicitly deferred; this is not full release approval.

# Harness changes, if any

Route inventory includes /dev/share so global accessibility and overflow checks cover it. No hooks or CI rules changed.
