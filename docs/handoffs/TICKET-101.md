# TICKET-101 handoff

- **2026-11-04 (unclechenna, claude):** event settings at `/admin/settings`.
  - New fields: add them to `SETTINGS_FIELDS`, `parseSettingsForm`, the defaults in `admin-settings.tsx`, and a field
    in `settings-form.tsx`. Validation stays in the shared `eventSettingsSchema`.
  - Signed-in browser tests now share `e2e/support/admin-session.ts`; pass a fresh `ADMIN_TEST_EMAIL` each run.
  - TICKET-080 (#98) adds `ordering_open` handling and touches `e2e/admin-menu.spec.ts` too; expect a small merge there.
