# Ticket

TICKET-091 — Import guests from CSV with a validation preview.

# Summary

Admins can now open Guests → Import guests, upload a spreadsheet CSV, review
row-specific errors or grouped invitations, and explicitly confirm the import.
The page uses TICKET-182’s transactional preview/commit service: invalid files
create nothing, repeated imports create no duplicates, and existing replies stay
unchanged. The route is `/admin/guests/import` inside the protected admin dashboard.

# Changes

- Added the private route, authenticated server-action adapter and Guests navigation
  link while preserving Add, Print and Seating links.
- Added a downloadable CSV template, strict UTF-8 decoding and a 256 KiB file limit.
  The server enforces the 300-guest bound, validates all rows and owns atomic writes.
- Preview shows household members/contact details, party limits, side and table;
  confirmation sends only the approved preview ID and digest.
- Changing the file invalidates approval and ignores delayed old results. Stale or
  expired approvals require previewing again; commit completion remains authoritative.
- File selection stays disabled until hydration, preventing cold-load selections
  from being lost before the change handler is ready. Error, preview and completion
  focus transitions support keyboard operation.

# Acceptance criteria and evidence

- Mobile and desktop real-auth browser flows each import 300 guests successfully.
  The merged TICKET-182 transaction tests establish all-or-nothing persistence.
- An invalid middle row and existing-contact conflict show row errors with no writes.
- Repeating the same 300-row CSV returns the existing receipt with no duplicates.
- Existing RSVP status, count and response timestamp remain unchanged throughout.
- The UI delegates validation and commit to TICKET-182; no duplicate parser or writer.

# Verification

- Production build passes on develop integration `4014839a` plus this ticket.
- Focused component/file/map/navigation tests pass (15 tests); route inventory is
  registered and covered by the related test suite.
- `pnpm verify:quick`: lint, types and 122 related tests pass; one database test
  is skipped in quick mode. The isolated database/browser flow runs separately.
- `pnpm exec tsx scripts/test-guest-import.ts`: mobile and desktop pass (21.5s final), including
  real email/TOTP authentication, 300-row import, duplicate prevention, RSVP
  preservation, 24 all-theme accessibility scans and screenshots.
- Initial expiry-during-commit and hydration regression tests failed before fixes.
  Browser assertions explicitly wait for an enabled file control and scope live
  regions to the page, excluding Next’s separate route announcer.
- Full `pnpm verify` remains the required exact-head CI merge gate; pending until CI completes.

# Screenshots and review steps

Evidence: `docs/reviews/TICKET-091/screenshots/{mobile,desktop}/` contains error,
preview and success states in Ivory & Gold, Emerald Night, Blush & Sage and
Midnight Champagne (24 images, 375px and 1280px).

1. Sign into the admin dashboard and open Guests → Import guests.
2. Download the template, fill in synthetic guest rows and preview it.
3. Try an invalid email; confirm the row error and that Import is unavailable.
4. Correct it, review the invitation grouping and explicitly import.
5. Repeat the same file; confirm the no-duplicates receipt.

# UI checklist

- PASS screenshots: mobile/desktop, all four themes and all three result states;
  independent visual inspection recorded in the ticket handoff.
- PASS tokens/restraint/typography: existing tokens and shared Button/Input, serif
  headings, 18px admin controls, restrained sections and bounded prose widths.
- PASS mobile: no horizontal overflow and 44px controls at 375/600/768/1280 widths.
- PASS motion: reduced-motion browser flow; no new animation or blocking reveal.
- PASS keyboard: labelled file input, keyboard confirmation and focused results;
  race/expiry/error focus also covered by component tests. No modal added.
- PASS contrast: axe scans in every theme for errors, preview and success.
- PASS load: measured initial CLS 0 in both browser projects; existing local fonts,
  no new images or font dependency.
- PASS copy/shared components: warm admin wording and existing UI primitives.
- N/A guest Lighthouse, WhatsApp/device sharing, QR and scanner feedback: this is
  an authenticated admin-only CSV page; those existing release gates remain intact.
- Verification: local quick/build/browser pass; full CI must pass before merge.

# Risks and rollout

Imports create drafts only; sending invitations remains a separate explicit action.
CSV previews contain private contact details and are restricted to the authenticated
admin. CSV data stays out of URLs, logs and persistent browser storage. TICKET-182
owns server retention: expired raw CSV is cleared on the next preview request,
not by a timed erasure job; the retention/deletion release work remains tracked.

No new schema, dependency, CI policy or production data operation in this ticket.
Deploy after TICKET-182 and its migration. Revert this UI commit to remove the route;
already imported records remain intact. No destructive rollback is proposed.

# Harness changes

Added an opt-in isolated admin browser harness; existing tests and security gates
remain unchanged. CI retains full verification and the invitation journey gate.
