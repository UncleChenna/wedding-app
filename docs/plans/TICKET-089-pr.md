# Ticket

TICKET-089 — Build the guest list with RSVP status and filters.

# Summary

Admins can open Guests from the control room, find households or named guests,
combine RSVP/sent/side/table filters, and share, revoke or reissue an invitation
without leaving the list. Revoking the currently filtered row returns keyboard
focus to the results announcement; reissuing refreshes its shared link.

# Changes

- Authorize before reading invitations, members or event settings. Return only the
  display data needed here; exclude contacts, notes and raw token fields.
- Combine household/member search and status, sent, side and table filters. Show
  named members separately from the preserved RSVP count, including withdrawn replies.
- Add Guests to the dashboard and six-section mobile navigation. Long names and
  side values wrap; bottom padding leaves the final action clear of the fixed bar.
- Reuse existing lifecycle/share actions and invalidate the guest list after changes.
  Failed reads show a retry state rather than a misleading empty list.
- Fix a shared Sheet Escape/reopen race discovered by the authenticated test:
  synchronize cancel through controlled state and ignore a stale close event when
  the dialog has already reopened. Actual native close still updates state.
- Add a real OTP/TOTP browser runner with 300 synthetic invitations, precise
  browser measurements and all-theme accessibility evidence. Existing shell
  regression now expects all six links and supports ticket-owned screenshot output.

# Acceptance criteria and evidence

- Combined filters: ten reader/filter/component tests pass. The real authenticated
  journey combines member search, status, sent, side and table; only its exact
  household remains. Revoke/reissue persistence, refreshed sharing URL, old-link
  rejection, new-link access and final withdrawal are exercised through the browser.
- 300-row rendering/filtering: five narrowing and five full 300-row remount samples
  per viewport measure actual input event through DOM update and two animation
  frames. Every sample is below 200 ms: maximum 49.2 ms at 375px and 32.3 ms at
  1280px. Initial first-row DOM-to-paint proxy is 18.8/39.8 ms respectively.
  These are browser rendering measurements, not a claim of sub-200 ms network load:
  navigation-to-rows was 303.9/124.2 ms. The initial pages contained 303/304 rows
  because previous synthetic audited fixtures are preserved; filtered datasets
  contain exactly the new 300 rows. Raw samples are in the performance JSON files.
- Mobile usability: authenticated screenshots and axe checks in all four themes,
  long-side wrapping, six 44px navigation links and last-action clearance at375px.
  Keyboard Escape/reopen and successful filtered revoke focus pass on both projects.

# Verification

- Production build passed.
- Ten guest-list unit/component/reader tests passed.
- Shared Sheet/UI suite:18 passed. Two new race regressions failed before the fix
  and passed afterward; the native-close regression passed throughout.
- `pnpm exec tsx scripts/test-admin-guest-list.ts`:2 passed in40.7s with real local
  Auth/database, mobile375px and desktop1280px. Includes16 axe scans across mixed
  status lists and expanded actions; no WCAG A/AA violations. Initial CLS=0 both.
- Existing shell/lifecycle/share browser regressions:80 passed in2.5m.
- Local quick gate passed lint, strict types and103 related tests across13 files.
  CI remains mandatory on the final pushed head.
- Independent source reviews found no blocking issue, including the bounded shared
  Sheet change. Screenshots reviewed for wrapping, readable contrast and navigation.

# Screenshots

`docs/reviews/TICKET-089/mobile/` and `desktop/` contain four palette captures and
raw performance samples; `mobile/bottom-navigation.png` demonstrates action clearance.
Shell captures at375/768/1280px are under `docs/reviews/TICKET-089/shell/`.

# UI checklist

- PASS screenshots, tokens, restraint/typography, mobile wrapping/targets, labelled
  keyboard controls, reduced motion and all-theme contrast. Real authenticated
  checks exercise native dialogs, return focus, shared-link refresh and withdrawal.
- PASS load: recorded initial CLS=0 at both widths. No images or font changes.
- PASS copy/shared components: warm existing labels and shared inputs/buttons/sheets.
- PASS ticket-specific performance as defined above. Guest Lighthouse is N/A:
  this is a private admin route; no guest rendering or QR output changed.
- Sharing/devices: authenticated share URLs are tested; physical WhatsApp/device
  behavior is not newly certified. Existing release/device requirements remain.
- Staff feedback and QR: N/A, no scanner or QR rendering changes.
- Verification: local production/authenticated checks above; final CI pending.

# Risks and rollout

No schema, dependency or production changes. TICKET-043 is merged and its lifecycle
implementation is reused. The Sheet fix affects every dialog using that primitive;
existing shell, lifecycle and sharing regressions must remain green. Import/export
and first-share sent tracking remain separate tickets. Revert this PR to remove
Guests and restore the preceding dialog behavior.

# Harness changes, if any

The opt-in runner uses fresh synthetic admin addresses, this worktree's guarded
local database and one browser worker. It deletes only its own unaudited fixtures;
audited rows are retained and revoked. It never resets a database or touches another
checkout. Run on a fresh Playwright port/server so the per-run allowlist is loaded.
