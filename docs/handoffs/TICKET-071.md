# TICKET-071 handoff

- **2026-11-03 (unclechenna, claude):** the confirmed-table view of `/order` now shows the real menu with live
  sold-out state.

  **What's there:**
  - `lib/menu.ts`: categories, guest-safe `MenuItem`, `groupMenu`, the availability schema and provisional copy.
  - `server/menu-repository.ts`, `server/menu.ts`: Drizzle reads and guest-safe load/response wrappers.
  - `GET /api/menu/availability`: `private, no-store`, returns only `{ id, available }`.
  - `components/menu-sections.tsx`: polls every 3s while visible, disables and clears sold-out choices, announces
    changes. `components/order-menu.tsx` wraps it with the heading and empty/unavailable states.

  **Tests:** `menu.test.ts`, `menu-sections.test.tsx`, and the opt-in `e2e/menu-availability.spec.ts`
  (`RUN_MENU_BROWSER_TESTS=1`, needs this worktree's database), which passed: sold out disabled within 5s, restock,
  axe and overflow in every theme and width.

  **Not done here:**
  - Photos: no image column on `menu_items`.
  - Lighthouse 95: runs scored 88–97 under heavy machine load; the unchanged baseline page scored the same. Re-run
    quietly.
  - WhatsApp and real devices (TICKET-201).

  **Next (TICKET-072):** quantities live in `MenuSections` state. Lift them into the cart; keep clearing an item
  when it sells out. Submission (TICKET-074) must revalidate availability and `max_per_order` on the server.

  **Local database tip:** this worktree's stack only started after copying `supabase/templates` into
  `.harness/supabase-project/supabase/` (TICKET-208) and starting without realtime, storage and studio (`supabase
start -x …`) because the machine was overloaded.
