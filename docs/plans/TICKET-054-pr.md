# Ticket

TICKET-054 — Prepare the day-before pass reminder batch.

# Summary

Admins can open Sharing → Prepare day-before pass reminders to see attending
households and preview the approved day-before message. Each existing Share menu
uses that message and the household’s current invitation link. Nothing is sent
automatically; the page explains that “tomorrow” means the day before the wedding.

# Changes

- Added protected `/admin/sharing/pass-reminders`, its navigation entry and route inventory.
- Query includes every invitation whose status is `rsvp_yes`; other statuses are excluded.
- Reused the approved `messages.dayBefore` template and original private invitation URL.
- Reused explicit sharing/Undo. These are generic invitation sharing attempts, not
  the non-responder-only `reminder` purpose introduced by TICKET-053. No new event
  purpose, migration, schedule, automatic send or delivery claim is introduced.
- Authorize before reading private links; distinguish empty results from failures
  and return friendly errors without database details.

# Acceptance criteria and evidence

- Isolated PostgreSQL test creates every invitation status plus a second attending
  household and proves the actual query returns exactly both attending rows.
- Unit tests verify approved day-before template selection, current link/version,
  authorization-before-read, empty/error distinction and every returned household.
- Real email/TOTP browser flows verify the route and approved WhatsApp message,
  exclude declined households, prove cancelled native sharing writes nothing,
  persist an explicit copy attempt and undo it without changing RSVP status,
  attendance count, response time or first-sent time.

# Verification

- Initial helper regression failed before implementation.
- Four focused tests pass; quick verification passes lint/types and 121 related
  tests (10 database-gated tests skipped in quick mode).
- `RUN_PASS_REMINDER_DB_TESTS=1 pnpm exec vitest run scripts/__tests__/pass-reminders.integration.test.ts`: 1 actual database test passes.
- Production build passes. `pnpm exec tsx scripts/test-pass-reminders.ts`: both
  mobile and desktop pass (25.9s), including all-theme axe, focus, layout and persistence.
- Independent source review and all four screenshots inspected: no blocking findings.
- Required full CI remains the merge gate. The shared baseline’s stale CI parity
  assertion is tracked in TICKET-221/PR #131; no full-green claim before that repair
  is integrated and the final head passes.

# UI checklist

- PASS screenshots: list and menu at 375px/mobile and 1280px/desktop in Ivory & Gold,
  independently inspected (`docs/reviews/TICKET-054/{mobile,desktop}/`).
- PASS tokens/restraint/typography: existing theme tokens, display headings, 18px
  admin body/actions, bounded prose and shared Button/Sheet/Input behavior.
- PASS mobile: overflow and 44px-target assertions at 375/600/768/1280 widths.
- PASS motion: reduced-motion browser mode; no new animation.
- PASS keyboard: Enter opens sharing, Escape restores focus, Undo focuses its notice.
- PASS contrast: axe passes in all four themes for both list and menu states.
- PASS load: initial CLS0 in both projects after fonts settle; no new images/fonts.
- PASS copy/shared components: approved day-before wording and existing Share menu.
- N/A guest-page Lighthouse and QR appearance: admin-only list, no QR rendering changes.
- Physical external-app delivery remains unverified in release-blocking TICKET-201;
  browser tests stub clipboard/native cancellation and do not send real messages.
- Verification: local checks above pass; full exact-head CI remains required.

# Review steps

1. Sign in as an admin; choose Sharing → Prepare day-before pass reminders.
2. Confirm only attending households appear with their day-before message.
3. Open Share invitation and inspect the prefilled WhatsApp/email links without sending.
4. Copy a synthetic invitation link; confirm an attempt is recorded, then Undo it.
5. Confirm the household’s RSVP remains unchanged.

# Risks and rollout

Private invitation links are available only after live admin authorization; the route
is no-store/noindex. The list reflects saved status when loaded, so refresh before
preparing a batch. Copy link copies the invitation URL; WhatsApp/email/native share
uses the approved message. The administrator chooses when and whom to contact.
No production or external message was sent. Revert this UI/query change to remove
the page; existing sharing history remains intact. No schema or dependency change.
