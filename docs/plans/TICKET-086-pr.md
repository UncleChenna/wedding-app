# Ticket

Ticket: TICKET-086

# Summary

Order alerts (TICKET-084) need to know who to message. Before this PR there was no way to record a kitchen or bar
person's WhatsApp number, or whether they want alerts.

After this PR an admin can do both from `/admin/staff`, for kitchen and bar staff only:

- set a WhatsApp number, normalised to E.164 with Nigeria (+234) as the default country
- tick "Send them order alerts"

`alertRecipients(db, station)` returns the opted-in, active staff of that station with their numbers. The WhatsApp
sender (TICKET-085) will use it.

# Changes

- **Schema and migration** (`drizzle/0019_oval_winter_soldier.sql`, additive only):
  - `staff.whatsapp_number` (text, nullable)
  - `staff.alerts_opt_in` (boolean, default false)
  - checks `staff_whatsapp_number_e164`, and `staff_alerts_need_number`: opting in needs a number and the kitchen or
    bar role
- **`src/modules/admin/lib/staff-alerts.ts`:** `normalizeWhatsAppNumber`, the Zod `alertContactSchema` and the copy.
- **`staff-repository.ts`:** `listStaff` returns the fields; `setAlertContact` updates only kitchen or bar staff.
- **`staff-actions.ts`:** `saveAlertContactAction`. A refused save keeps what was typed.
- **`staff-alert-form.tsx`**, shown under each kitchen or bar person on the staff page. Bug found by the new browser
  test and fixed here: React resets a form after its action runs, which left the box unticked after a refused save.
  The fields now remount with the right defaults after each result.
- **`src/modules/ordering/server/alert-recipients.ts`:** `alertRecipients(db, station)`.
- **Tests:**
  - unit: `src/modules/admin/__tests__/staff-alerts.test.ts`
  - database: `scripts/__tests__/alert-recipients.integration.test.ts`
  - browser: a new `e2e/admin-staff.spec.ts` case

# Acceptance criteria and evidence

- [x] **Only opted-in staff of the matching station are recipients.** In
      `alert-recipients.integration.test.ts` (`RUN_ALERT_RECIPIENT_DB_TESTS=1`):
  - Only opted-in, active staff of the station are returned, with their numbers.
  - Gate staff can't opt in.
  - The database refuses an opt-in without a number.
  - The normalisation and schema rules are unit-tested.

# Verification

- **On develop at `9bbe452e`:**
  - `pnpm db:reset` (clean migrate and seed), then `pnpm db:migrate` again: only a Postgres notice ("schema drizzle
    already exists"), so it reruns safely.
  - `pnpm db:check-rls`: all 20 public tables have RLS.
  - `pnpm db:seed`: fine.
- **Unit and database tests:** `RUN_ALERT_RECIPIENT_DB_TESTS=1 vitest run scripts/__tests__/alert-recipients.integration.test.ts src/modules/admin`:
  128 passed.
- **Browser tests** (`playwright test e2e/admin-staff.spec.ts --project=mobile`, with `RUN_ADMIN_STAFF_TESTS=1`, a
  fresh `ADMIN_TEST_EMAIL` on `ADMIN_EMAIL_ALLOWLIST`, and a random `STAFF_SESSION_SECRET`):
  - The new alerts case passed. It covers a refused opt-in that keeps the tick, a save of `0803 123 4567` stored as
    `+2348031234567`, an axe scan with no violations in every theme at 375px, and no horizontal scroll.
  - The existing PIN case also passed.
- **Static checks:** `tsc`, ESLint and `pnpm build` are clean. `verify:quick` runs in `t:pr`; CI runs the full
  `pnpm verify`.

# Risks and rollout

- **Migration:** additive (two columns and two checks); existing rows get `alerts_opt_in = false`.
- **No messages yet:** nothing is sent until TICKET-085 plugs a WhatsApp sender into the outbox.
- **Rollback:** revert the PR, then drop the two columns in a follow-up migration, which needs the owner's yes because
  it's destructive.

# Screenshots

`docs/reviews/TICKET-086/375-alert-opt-in.png`: the staff page at 375px in the first theme, after saving an opt-in.

# UI checklist

Admin screen scope (docs/ui-checklist.md):

- [x] **Screenshots:** one theme at 375px, inspected (number normalised, box ticked, saved message).
- [x] **Tokens:** uses only the shared `Input`, `Checkbox` and `Button`, with no hard-coded colours.
- [x] **Restraint and typography:** sits inside the existing staff card; 18px status text.
- [x] **Mobile:** no horizontal scroll at 375px in any theme (asserted); the shared controls meet 44px.
- [x] **Motion:** N/A, nothing animates.
- [x] **Keyboard:** native form with labelled fields and a named Save button.
- [x] **Contrast:** the axe scan in every theme found no violations.
- [x] **Load and images:** N/A, no images.
- [x] **Performance:** N/A, admin screen.
- [x] **Copy:** short and warm. The copy is provisional, as there's no PRD wording for alerts.
- [x] **Shared components:** reused, with no new pattern.
- [x] **Sharing and devices:** N/A, admin screen.
- [x] **QR codes:** N/A.
- [x] **Staff feedback:** a saved or refused status message appears immediately.
- [x] **Verification:** see above; CI runs the full `pnpm verify`.

# Harness changes, if any

None.
