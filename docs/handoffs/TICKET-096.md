# TICKET-096 handoff

- **2026-11-05 (unclechenna, claude):** staff PINs at `/admin/staff`.
  - `issueStaffPin` returns the PIN once and stores only its hash; `revokeStaff` clears it. Both bump
    `credential_version`, which `authenticateStaff` checks on every staff request.
  - Issuing needs the venue time zone (Settings).
  - **Running the signed-in test:** set `STAFF_SESSION_SECRET` to 32 random bytes in hex, a fresh `ADMIN_TEST_EMAIL`,
    and the same address on `ADMIN_EMAIL_ALLOWLIST`, then run
    `RUN_ADMIN_STAFF_TESTS=1 pnpm exec playwright test e2e/admin-staff.spec.ts --project=mobile`.
  - **Next:** WhatsApp numbers and alert opt-ins (TICKET-086, needs a column), plus the boards using these sign-ins.
