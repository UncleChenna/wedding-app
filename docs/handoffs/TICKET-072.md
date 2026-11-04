# TICKET-072 handoff

- **2026-11-03 (unclechenna, claude):** guests can now send orders from `/order`.

  **What's there:**
  - `lib/order.ts`: submission schema (plain-text 140-character note), replay fingerprint, result and response
    schemas, provisional copy.
  - `lib/submit-order.ts`: `submitOrder` retry loop (1s/2s/4s, 10s per attempt, same id) and `newRequestId`.
  - `server/create-order.ts`: the transactional write; `server/order-response.ts` and `POST /api/orders`.
  - `components/order-composer.tsx` (cart and states), `use-menu-availability.ts` (polling from TICKET-071) and the
    now-controlled `menu-sections.tsx`.

  **Tests:** `order.test.ts`, `order-composer.test.tsx` and the updated `menu-sections.test.tsx`; opt-in
  `scripts/__tests__/create-order.integration.test.ts` (`RUN_ORDER_SUBMIT_DB_TESTS=1`, 9 passed) and
  `e2e/order-submit.spec.ts` (`RUN_ORDER_BROWSER_TESTS=1`, 3 passed).

  **Next:**
  - TICKET-073: add open-order and cooldown limits inside `createOrder`'s transaction (a new rejection reason and copy).
  - TICKET-074: the station split already happens on write; add its tests and the grouped guest confirmation.
  - TICKET-075: live status after "On its way".
  - TICKET-080: gate `POST /api/orders` on the admin open/close switch. Until then, any confirmed table can order.

  **Watch:** page weight is 412 KB against the PRD's 200 KB, mostly fonts (188 KB) and framework JS, and it was already
  so before this ticket. Worth its own ticket.
