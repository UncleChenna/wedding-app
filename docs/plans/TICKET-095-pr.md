# Ticket

Ticket: TICKET-095

# Summary

The couple had no way to set the menu or mark items sold out. The guest order page already reacts to availability
within seconds (TICKET-071), but nothing in admin could change it.

`/admin/menu` now lists every item by category, shown as Available or Sold out in words, and lets the couple:

- mark an item sold out or available
- edit an item: name, description, category, station, most per order, position and dietary tags
- remove an item that has never been ordered
- add new items

An item without a station is refused, because every order is routed by station.

# Changes

- **`src/modules/admin/lib/menu-item.ts`:** the Zod schema and form parsing (single-line text, normalised tags),
  field errors, submitted values for a refused form, and copy.
- **`server/menu-repository.ts`:** Drizzle list, insert, update, availability and delete. Delete reports "in-use"
  when orders reference the item.
- **`server/menu-actions.ts`:** Server Actions. Each one checks admin access itself, revalidates the page, and hides
  database errors.
- **`components/admin-menu.tsx`** (server), plus `menu-item-form.tsx` and `menu-item-actions.tsx` (client).
- **`src/app/(admin)/admin/(protected)/menu/page.tsx`**, with `adminMenu` added to the route registry, the admin
  shell's navigation (the phone bar now has 4 columns) and the control-room grid.
- **Tests:**
  - `menu-item.test.ts`
  - shell and dashboard tests updated for the Menu link
  - `e2e/admin-menu.spec.ts`
  - `e2e/admin-shell.spec.ts` updated

# Acceptance criteria and evidence

- [x] **The sold-out toggle updates the order page within 5 seconds (end-to-end).**
  - `e2e/admin-menu.spec.ts` signs in as a real admin (local email code plus TOTP) and adds an item.
  - A separate guest browser opens `/order` for a fixture table. "Mark sold out" disables the item there in under 5
    seconds, with "Sold out" as its description. "Mark available" re-enables it.
- [x] **Validation prevents an item without a station.**
  - Unit: missing, empty and unknown stations are each refused with "Choose the kitchen or the bar."
  - End-to-end: submitting without a station writes nothing, focuses that field, and keeps everything else typed.

# Verification

- `vitest run src/modules/admin src/modules/ordering src/modules/shared/__tests__/routes.test.ts`: 119 passed.
- `playwright test e2e/admin-menu.spec.ts e2e/admin-shell.spec.ts e2e/access-matrix.spec.ts
e2e/menu-availability.spec.ts --project=mobile`: 7 passed on a production build. The admin test was run with
  `RUN_ADMIN_MENU_TESTS=1`, a fresh `ADMIN_MENU_TEST_EMAIL` on `ADMIN_EMAIL_ALLOWLIST`, and this worktree's local Auth.
- `pnpm typecheck`, ESLint and Prettier: clean. Full `pnpm verify`: run by `pnpm t:pr`; see CI.
- **Not verified:** photos (no column), real phones.

# Risks and rollout

- No schema, migration, dependency, CI or RLS changes.
- Removal has no confirmation step. It only works for items that have never been ordered; ordered items are refused.
- To roll back, revert this PR.

# Screenshots

`docs/reviews/TICKET-095/<theme>/<width>-menu.png` covers all four themes at 375, 768 and 1280px.

# UI checklist

Recorded item by item in `docs/reviews/TICKET-095/REVIEW.md`.

- **Pass:** screenshots, tokens, typography, mobile, keyboard, contrast, copy, shared components, staff feedback.
- **N/A:** motion, images, performance, QR.
- **Not verified:** devices.

# Harness changes, if any

None.
