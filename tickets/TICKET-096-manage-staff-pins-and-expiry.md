---
id: TICKET-096
title: Manage staff, PINs and expiry
epic: admin
status: in_review
priority: high
estimate: M
labels: [frontend, backend, security]
module: admin
owner: unclechenna
agent: claude
blocked_by: [TICKET-031, TICKET-088, TICKET-034]
blocks: [TICKET-086, TICKET-129, TICKET-134, TICKET-166]
branch: TICKET-096
pr: https://github.com/UncleChenna/wedding-app/pull/101
created: 2026-10-21
updated: 2026-11-05
started: 2026-11-05
completed: ""
reason: ""
resume_to: ""
---

# TICKET-096: Manage staff, PINs and expiry

## Context

ADM-4: staff PIN management; PINs expire after the event.

See: [Admin dashboard](../docs/prd.md#admin-dashboard) (ADM-4) · [Security](../docs/prd.md#security).

## Scope

- Staff CRUD with role, WhatsApp number, expiry.
- Generate and show a PIN once; reset; revoke sessions.

## Out of scope

- Alert opt-in UI (TICKET-086).

## Acceptance criteria

- [x] A PIN is shown once and only its hash is stored (unit).
- [x] Revoking a staff member signs out their devices within 1 minute (e2e).

## Test plan

- Unit: PIN lifecycle.
- End-to-end: Create staff and sign in.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/admin/`

## Notes / decisions

_Agents append dated notes here while working._

- 2026-11-05:
  - **Page.** `/admin/staff` (in the shell's navigation and the control-room grid). People are grouped by gate, kitchen
    and bar, each with their PIN state in words. Actions: Add a person, Issue/Reset PIN, Remove access.
  - **PIN lifecycle** (`server/staff-repository.ts`):
    - Six random digits, checked against every other active PIN, because sign-in refuses a PIN that matches two people.
    - Only the scrypt hash is stored (TICKET-031's `hashStaffPin`). The PIN is returned once in the action result and
      shown in a panel; it never appears in the list or after a reload.
    - It expires at 06:00 venue time after the wedding (`staffEventExpiry`). Issuing is refused without a venue time
      zone or after the event.
    - Reset and revoke bump `credential_version`. Revoke also clears the PIN and marks it revoked. Every staff request
      already rechecks both through `authenticateStaff`, so a device is signed out on its very next screen.
  - **Shell.** With six links, phones now show "Sign out" in the header and the five sections in the bottom bar; the
    desktop sidebar still lists Sign out.
  - **Not here:** WhatsApp numbers (no column yet, so it needs a migration; the alert recipients themselves are
    TICKET-086), and a confirmation step before removing access.
  - **Evidence.**
    - Database (`RUN_STAFF_ADMIN_DB_TESTS=1`, 5 passed): hash only, verifiable and not containing the PIN; venue-time
      expiry; reset and revoke versioning; no duplicate PINs; the time-zone and event-over refusals.
    - Signed-in browser test (`RUN_ADMIN_STAFF_TESTS=1`, fresh `ADMIN_TEST_EMAIL`, `STAFF_SESSION_SECRET`): add with
      validation, issue, the PIN gone after reload, a kitchen device signs in with it, and after Remove access that
      device's next screen asks for a PIN again.
    - Unit: `staff.test.ts`.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-04 — todo → claimed — divine (codex)
- 2026-11-04 — todo → released — divine (codex)
- 2026-11-05 — todo → claimed — unclechenna (claude)
- 2026-11-05 — todo → in_progress — unclechenna (claude)
- 2026-11-05 — in_progress → in_review — unclechenna (claude)
