# Ticket

Ticket: TICKET-064

# Summary

Before this change, the gate, kitchen and bar devices got an id on first sign-in (TICKET-031), but each was only ever
called "kitchen device" and nobody could change that. Now:

- `/admin/staff` has a **Devices** section where the couple can rename each device, for example "Kitchen tablet 1".
- Each signed-in staff screen says which device it is ("This device is Kitchen tablet 1.") and picks up a new name on
  its next screen.
- A device keeps the same id across reloads, signing out and in again, and offline periods.

# Changes

- **`src/modules/shared/server/staff-cookies.ts`:** `currentStaffDevice(role)` returns the signed-in identity along
  with the device's id and name. `currentStaff` is now a wrapper around it.
- **`src/modules/shared/components/staff-entry.tsx`:** shows the device's name beneath "You're signed in."
- **`src/modules/admin/server/device-repository.ts`:**
  - `listDevices` returns each device's role, who first signed in on it, and whether that person's access was removed.
  - `renameDevice`
- **`server/device-actions.ts`:** `renameDeviceAction`, which checks admin access itself and validates with Zod.
- **`lib/device.ts`:** name and id schemas, and the copy.
- **Components:** `admin-devices.tsx` (server) and `device-rename-form.tsx` (a controlled field, so a refused name
  stays in the box). Both are rendered by `admin-staff.tsx`.
- **Tests:**
  - `src/modules/admin/__tests__/device.test.ts`
  - `e2e/admin-staff.spec.ts` extended: same id after a reload and a fresh sign-in, the rename, the new name on the
    device, and screenshots with axe.

# Acceptance criteria and evidence

- [x] **A device keeps its id across reloads and offline periods.**
  - The id is a 64-hex value in a signed, 90-day `staff_device` cookie. Keeping it needs no network.
  - The e2e checks that the id is unchanged after a reload, a sign-out, and signing in again, with still exactly one
    `registered_devices` row.
- [x] **Renaming a device updates the name shown on new results.**
  - The e2e renames the device to "Kitchen tablet NN" and reloads it, and the device then shows
    "This device is Kitchen tablet NN."
  - The gate's "already used" result and the scan log come with TICKET-061 and TICKET-062. They read
    `registered_devices.name` by id, so they get the new name with no further work.

# Verification

- `vitest run src/modules/admin`: passes, including the 2 new device tests.
- `playwright test e2e/admin-staff.spec.ts --project=mobile`: 1 passed (15.5s), run with `RUN_ADMIN_STAFF_TESTS=1`, a
  fresh `ADMIN_TEST_EMAIL` on `ADMIN_EMAIL_ALLOWLIST`, and a random `STAFF_SESSION_SECRET`.
- `tsc`, ESLint and Prettier on the changed files: clean. Full `pnpm verify` is run by `pnpm t:pr`; see CI.
- **Not verified:**
  - real tablets and phones
  - airplane mode on a real device: offline survival rests on the cookie needing no network

# Risks and rollout

- No schema, migration, dependency, CI or RLS changes.
- A device that clears its cookies gets a new id and a new "… device" row. The old row stays listed. Deleting devices
  is out of scope.
- To roll back, revert this PR.

# Screenshots

All four themes at 375, 768 and 1280px:

- `docs/reviews/TICKET-064/<theme>/<width>-admin-devices.png`
- `docs/reviews/TICKET-064/<theme>/<width>-device-name.png`

# UI checklist

Recorded item by item in `docs/reviews/TICKET-064/REVIEW.md`.

- **Pass:** screenshots, tokens, typography, mobile, keyboard, contrast, copy, shared components, staff feedback.
- **N/A:** motion, images, performance, QR.
- **Not verified:** devices.

# Harness changes, if any

None.
