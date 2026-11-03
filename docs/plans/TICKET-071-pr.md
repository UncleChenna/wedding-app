# Ticket

Ticket: TICKET-071

# Summary

After TICKET-070, a guest who confirmed their table saw only "the menu isn't open here yet". Now `/order` shows the real
menu from `menu_items`, grouped as Meals, Soft drinks and Alcoholic drinks.

Sold-out items stay visible. Each one says "Sold out" in text tied to its quantity control, and that control is
disabled. When an item sells out while the page is open, it changes within about 3 seconds without a reload. Any
quantity the guest had chosen is cleared, and a screen-reader announcement says "… has just sold out." Restocked items
come back the same way.

Sending an order is still out of scope (TICKET-072/074), so the menu says "Sending orders from here opens soon. Until
then, please ask the team."

# Changes

- **`src/modules/ordering/lib/menu.ts`:**
  - category order and labels, and the guest-safe `MenuItem` shape
  - `groupMenu`, which hides empty categories
  - a strict Zod schema for the availability payload
  - provisional copy in `menuCopy`
- **`server/menu-repository.ts`:** Drizzle reads of the menu and of `{ id, available }`. Station and timestamps are
  never selected.
- **`server/menu.ts`:** `loadMenu` returns `ready` or `unavailable`. `menuAvailabilityResponse` returns 200 or a fixed
  503, always `private, no-store`, and logs no details.
- **`src/app/api/menu/availability/route.ts`:** a per-request GET. The service worker already sends `/api/` to the
  network only.
- **`components/menu-sections.tsx`** (client):
  - polls every 3 seconds while the tab is visible, and once immediately on return
  - skips overlapping requests
  - keeps the last known state on failure or a malformed payload
  - ignores items it didn't load with
- **`components/order-menu.tsx`:** heading, not-open note, and empty and unavailable states.
- **`components/order-entry.tsx`:** renders the menu below the table confirmation and drops the old placeholder line.
- **Docs:** module README, `docs/journeys.md`, dated plan, UI review, performance record, handoff and ticket notes.

# Acceptance criteria and evidence

- [x] **Sold out disables the item on an open page within 5 seconds.**
  - `e2e/menu-availability.spec.ts` sets `is_available = false` on a fixture item in the database.
  - It expects the control to be disabled within 5 seconds (the elapsed time is asserted too), the chosen quantity
    reset to 0, and the item restored after a restock.
  - The admin control is TICKET-095. The last criterion allows fixtures until it exists.
- [x] **Sold out is announced with text.**
  - The control's accessible description is "Sold out".
  - A polite live region announces "… has just sold out." and "… is available again."
  - Covered by the component test and the browser test.
- [x] **Every theme renders at 375px without overflow.** The browser test checks for no horizontal scroll and runs axe
      in all four themes at 375, 768 and 1280.
- [x] **Live changes remove sold-out items from new choices.**
  - Sold-out quantities are cleared and the control is disabled.
  - The endpoint and component are documented as display only.
  - Revalidating items when an order is submitted is TICKET-074's job.

# Verification

- `vitest run src/modules/ordering`: 5 files, 28 tests passed.
- `pnpm typecheck`, ESLint and Prettier on the changed files: clean.
- `pnpm build`: lists `ƒ /api/menu/availability` and `ƒ /order`.
- `RUN_MENU_BROWSER_TESTS=1 pnpm exec playwright test e2e/menu-availability.spec.ts --project=mobile --workers=1`:
  2 passed (25 seconds), against a production build and this worktree's seeded database.
- Full `pnpm verify`: run by `pnpm t:pr`; see CI.
- **Not verified:**
  - **Lighthouse at 95.** Mobile Performance scored 97, 94, 88 and 89 (one run failed to record), with Accessibility
    100 and CLS 0. The unchanged table form scored 89 on the same server at the same time, with the same heading as the
    largest element, so the shortfall is machine load (load average 18–25). It needs a re-run on a quiet machine.
  - WhatsApp in-app browsers and physical devices (TICKET-201).

# Risks and rollout

- No schema, migration, dependency, CI or RLS changes.
- About 300 guests polling every 3 seconds is roughly 100 small reads a second at peak. Each one selects two columns
  from about 20 rows and returns no-store JSON. Polling pauses while a tab is hidden.
- Photos are deferred: `menu_items` has no image column.
- Quantities are local state until the cart (TICKET-072).
- To roll back, revert this PR.

# Screenshots

`docs/reviews/TICKET-071/<theme>/<width>-menu.png` covers Ivory & Gold, Midnight & Champagne, Emerald Night and Blush &
Sage at 375, 768 and 1280px. Each shows a fixture meal that has just sold out.

# UI checklist

Recorded item by item in `docs/reviews/TICKET-071/REVIEW.md`.

- **Pass:** screenshots, tokens, typography, mobile, keyboard, contrast, load (CLS 0), copy (provisional), shared
  components.
- **N/A:** motion, QR, staff feedback, images (no image column).
- **Not verified:** Lighthouse at 95 (machine load), WhatsApp and devices.

# Harness changes, if any

None. This worktree's local database only started after copying `supabase/templates` into the managed stack (TICKET-208)
and leaving out realtime, storage and studio.
