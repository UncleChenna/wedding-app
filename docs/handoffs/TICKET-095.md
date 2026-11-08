# TICKET-095 handoff

- **2026-11-04 (unclechenna, claude):** the admin menu editor is at `/admin/menu`.
  - **Running the signed-in test:** start this worktree's full stack (`pnpm db:start`, including Auth and Mailpit),
    then run
    `E=menu-$(date +%s)@example.test; ADMIN_MENU_TEST_EMAIL=$E ADMIN_EMAIL_ALLOWLIST=$E RUN_ADMIN_MENU_TESTS=1 pnpm exec playwright test e2e/admin-menu.spec.ts --project=mobile`.
    Each address can only enrol TOTP once, so use a fresh one each run.
  - **Lesson:** React 19 resets a `<form action>` after every action, so return the rejected values and keep
    `<select>`s controlled. Pages with closed `<details>` need transitions disabled before `applyTheme`/`scanA11y`.
  - **Next admin tickets:** ordering on/off (080), event settings (101, including the cooldown default), staff and
    PINs (096), and revoke/reissue (043).
