# TICKET-064 handoff

- **2026-11-05 (unclechenna, claude):** device names.
  - **Where to rename:** the Devices section on `/admin/staff`.
  - **Device id:** the signed `staff_device` cookie (64 hex characters), with one `registered_devices` row per id.
  - **On staff screens:** `currentStaffDevice(role)` in `shared/server/staff-cookies.ts` returns the identity and the
    device `{ id, name }`. Use it in TICKET-061 and TICKET-062 to stamp scans and to show "already used on <name>".
  - **Running the test:** as for TICKET-096, run `e2e/admin-staff.spec.ts` with `RUN_ADMIN_STAFF_TESTS=1`.
  - **Next:** TICKET-061 and TICKET-062 (the gate results and scan log showing the name).
