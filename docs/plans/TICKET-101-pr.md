# Ticket

Ticket: TICKET-101

# Summary

The couple had no way to set their event details: names, date, ceremony time, venue time zone, venue, map, dress code,
RSVP cutoff, invitation voice, plus-ones, data retention and the ordering limits. `/admin/settings` now holds them all in
one form.

Saving takes effect at once. Invitations show the new details on their next load, and the next order uses the new
limits.

Undecided details can stay blank. A blank time zone is never filled with a default, so replies stay closed until a
real one is set. An RSVP cutoff after the wedding has begun is refused.

# Changes

- **`src/modules/admin/lib/settings-form.ts`:**
  - parses the form into the shared `eventSettingsSchema` with plain-language field messages
  - venue-time conversion (`zonedLocalToUtc` and `utcToZonedLocal`, safe across daylight saving)
  - the cutoff-before-the-wedding rule
  - submitted values for a refused form
  - copy
- **`server/settings-actions.ts`:** a Server Action that checks admin access itself, saves every edited field, and
  revalidates the whole layout so cached guest pages refresh.
- **Components:** `admin-settings.tsx` (server, loads current values) and `settings-form.tsx` (client, grouped
  fieldsets).
- **Routing:** `src/app/(admin)/admin/(protected)/settings/page.tsx` and `adminSettings` in the route registry. It's in
  the admin shell's navigation (the phone bar now has 5 columns) and linked from the control room.
- **Tests:**
  - `settings-form.test.ts`
  - shell and dashboard tests updated for the Settings link
  - `e2e/admin-settings.spec.ts`
  - the shared `e2e/support/admin-session.ts` sign-in helper, now also used by `e2e/admin-menu.spec.ts`

# Acceptance criteria and evidence

- [x] **Saving updates the invitation page and the limits immediately (end-to-end).** Signed in as a real admin:
  - a new venue is stored and appears on a real `/i/<token>` page on its next load
  - with the cooldown at 0, a table orders twice in a row; after saving 3600 seconds, the next order is refused as
    `cooldown`
- [x] **Invalid dates are rejected (unit).** A cutoff after the start of the wedding day is refused with a clear message,
      in the unit tests and in the browser. A cutoff needs a time zone. An impossible date is refused.
- [x] **Undecided details can stay blank, but replies need a valid time zone.**
  - Unit: blank details are stored as `null`, and a blank time zone stays `null` rather than defaulting. An invalid zone
    such as `Mars/Olympus` is refused.
  - Replies only open once a valid zone exists, which the existing `rsvpWindow` already enforces.

# Verification

- `vitest run src/modules/admin src/modules/shared`: 300 passed.
- `playwright test e2e/admin-settings.spec.ts --project=mobile`: passed, run with `RUN_ADMIN_SETTINGS_TESTS=1`, a
  fresh `ADMIN_TEST_EMAIL` on `ADMIN_EMAIL_ALLOWLIST`, and this worktree's local Auth.
- `playwright test e2e/admin-shell.spec.ts e2e/access-matrix.spec.ts e2e/a11y-routes.spec.ts --project=mobile`: 115
  passed on a production build.
- `pnpm typecheck`, ESLint and Prettier: clean. Full `pnpm verify`: run by `pnpm t:pr`; see CI.
- **Not verified:** real phones.

# Risks and rollout

- No schema, migration, dependency, CI or RLS changes.
- Wi-Fi details aren't included: there's no column yet, and the table cards that print them are TICKET-094.
- **This lets the owner settle the cooldown default** (30 or 60 seconds) without a migration.
- To roll back, revert this PR.

# Screenshots

`docs/reviews/TICKET-101/<theme>/<width>-settings.png` covers all four themes at 375, 768 and 1280px.

# UI checklist

Recorded item by item in `docs/reviews/TICKET-101/REVIEW.md`.

- **Pass:** screenshots, tokens, typography, mobile, keyboard, contrast, copy, shared components, staff feedback.
- **N/A:** motion, images, performance, QR.
- **Not verified:** devices.

# Harness changes, if any

None.
