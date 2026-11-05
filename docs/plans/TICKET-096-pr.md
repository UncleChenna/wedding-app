# Ticket

Ticket: TICKET-096

# Summary

Staff sign-in (TICKET-031) existed, but there was no way to give anyone a PIN. `/admin/staff` now lets the couple:

- add gate, kitchen and bar staff
- issue or reset a PIN
- remove someone's access

A new PIN is shown **once** and only its hash is stored. Removing access signs that person's devices out on their very
next screen.

# Changes

- **`src/modules/admin/server/staff-repository.ts`:**
  - `listStaff`, with each PIN's state worked out on the server
  - `addStaff`
  - `issueStaffPin`, in a transaction: venue-time expiry, a unique PIN, the hash stored, `credential_version` bumped
  - `revokeStaff`, which clears the PIN, bumps the version and marks it revoked
- **`server/staff-actions.ts`:** Server Actions, each checking admin access itself. The PIN is returned once and never
  logged.
- **`lib/staff.ts`, `lib/staff-pin.ts`, `lib/staff-time.ts`:** validation, copy, PIN generation, and venue-time expiry
  formatting.
- **Components:** `admin-staff.tsx` (server), `add-staff-form.tsx`, and `staff-member-actions.tsx` (including the
  one-time PIN panel).
- **Routing:** `/admin/staff` page and the `adminStaff` route, in the shell and the control room. On phones Sign out
  moves into the header so the bar fits 5 sections.
- **Tests:**
  - `staff.test.ts`
  - shell and dashboard tests updated
  - `scripts/__tests__/staff-admin.integration.test.ts`
  - `e2e/admin-staff.spec.ts`
  - `e2e/admin-shell.spec.ts` updated

# Acceptance criteria and evidence

- [x] **A PIN is shown once, and only its hash is stored.**
  - Database test: the stored value is a scrypt envelope that verifies against the PIN and doesn't contain it, and
    nothing in the list includes the PIN.
  - Browser: the PIN appears in the panel after issuing, and is gone after a reload.
- [x] **Revoking a staff member signs their devices out within a minute (end-to-end).** A kitchen device signs in at
      `/kitchen` with the issued PIN. After Remove access, its next load shows the PIN form again, well inside a minute.
      Every staff request rechecks revocation and the credential version.

# Verification

- `pnpm test`: 993 passed (91 opt-in skips).
- `RUN_STAFF_ADMIN_DB_TESTS=1 vitest run scripts/__tests__/staff-admin.integration.test.ts`: 5 passed.
- `playwright test e2e/admin-staff.spec.ts --project=mobile`: passed, run with `RUN_ADMIN_STAFF_TESTS=1`, a fresh
  `ADMIN_TEST_EMAIL` on `ADMIN_EMAIL_ALLOWLIST`, and a random `STAFF_SESSION_SECRET`.
- `playwright test e2e/admin-shell.spec.ts e2e/access-matrix.spec.ts e2e/a11y-routes.spec.ts --project=mobile`: 119
  passed on a production build.
- `pnpm typecheck`, ESLint and Prettier: clean. Full `pnpm verify`: run by `pnpm t:pr`; see CI.
- **Not verified:** real phones.

# Risks and rollout

- No schema, migration, dependency, CI or RLS changes.
- **Issuing a PIN needs the venue time zone** (Settings), because PINs expire at 06:00 venue time after the wedding.
- WhatsApp numbers aren't included: that needs a column, and the alert recipients themselves are TICKET-086.
- Removing access has no confirmation step.
- To roll back, revert this PR.

# Screenshots

`docs/reviews/TICKET-096/<theme>/<width>-pin.png` covers all four themes at 375, 768 and 1280px.

# UI checklist

Recorded item by item in `docs/reviews/TICKET-096/REVIEW.md`.

- **Pass:** screenshots, tokens, typography, mobile, keyboard, contrast, copy, shared components, staff feedback.
- **N/A:** motion, images, performance, QR.
- **Not verified:** devices.

# Harness changes, if any

None.
