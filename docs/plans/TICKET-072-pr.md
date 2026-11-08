# Ticket

Ticket: TICKET-072

# Summary

Guests could see the menu and its live sold-out state but couldn't order. Now they choose quantities, add an optional
140-character note and press **Send order**.

On a bad connection the page retries automatically with the same request id. It shows "Sending your order…", then
"Still sending. The signal is slow, so we're trying again." Once the server confirms, it shows "On its way. Sit back,
we've got this." If every attempt fails, it says so and offers **Try again**, which reuses the id.

A response lost after the server committed can't create a second order. Reusing an id for a different order is
refused.

# Changes

- **`POST /api/orders`** (`src/app/api/orders/route.ts`, `server/order-response.ts`):
  - accepts JSON bodies up to 8 KB, validated with Zod
  - returns 201 created, 200 replayed, 409 mismatch, 422 rejected, or 503 for database trouble (retryable, no details)
  - always `private, no-store`
- **`server/create-order.ts`**, one transaction:
  1. A replay is compared with the stored order: identical returns the original, anything else is a mismatch.
  2. The table must exist.
  3. The chosen menu rows are locked `FOR SHARE`, then checked for existence, availability and `max_per_order`.
  4. The order, one station row per station and the items (with `quantity_limit` snapshotted) are inserted.

  A duplicate tap racing in parallel loses the unique insert and answers as a replay.

- **`lib/order.ts`:**
  - the submission schema, with the note normalised to plain text and a 140-character limit
  - the replay fingerprint (order-independent)
  - result and response schemas
  - copy
- **`lib/submit-order.ts`:**
  - the retry loop: 1s, 2s and 4s backoff; a 10-second timeout per attempt; no retry on rejections
  - `newRequestId`, with a fallback for browsers without `randomUUID`
- **Components:**
  - `OrderComposer`: cart, note, sticky Send / Try again, and the sent confirmation, which takes focus
  - `useMenuAvailability`: the TICKET-071 polling, extracted, plus marking server-refused items sold out
  - `MenuSections`: now controlled by the composer
  - the "orders open soon" line is removed
- **Docs:** module README, `docs/journeys.md`, dated plan, UI review, performance record, handoff and ticket notes.

# Acceptance criteria and evidence

- [x] **Three retries create one order.**
  - Unit: a fake idempotent server commits and then loses the response three times. `submitOrder` makes 4 attempts with
    the same id, and 1 order is stored.
  - End-to-end: Playwright lets the request reach the server, then drops the response three times. The guest sees
    "Still sending", then "On its way", and the database holds exactly one new order.
- [x] **Sending, sent and failed states; failed offers a retry.**
  - Component tests cover each state, choices locked while sending, focus on the confirmation, "Try again" reusing the
    id, and an edit after a failure starting a new id.
  - End-to-end: a dead connection shows the failed state; after reconnecting, "Try again" delivers once.
- [x] **The note is limited and stored as plain text.** Schema tests cover control and format characters, collapsed
      whitespace, and 140 versus 141 characters. End-to-end, `No pepper, <b>please</b>` is stored and rendered literally.
- [x] **Transactional validation, and replay bound to the payload and table.** Opt-in database tests:
  - replay in any item order returns the same order
  - changing the items or the note gives a mismatch
  - six parallel duplicate taps produce one order (1 created, 5 replayed)
  - sold-out, over-limit, missing-table and unknown-item submissions write nothing
  - a concurrent sold-out change makes the order wait, then refuses the item
  - a failure partway through rolls back the whole submission

  End-to-end: an item that sold out after the page loaded is refused, taken out and marked "Sold out", and the rest
  of the order then sends.

# Verification

- `vitest run src/modules/ordering`: 53 passed.
- `RUN_ORDER_SUBMIT_DB_TESTS=1 vitest run scripts/__tests__/create-order.integration.test.ts`: 9 passed.
- `RUN_ORDER_BROWSER_TESTS=1 RUN_MENU_BROWSER_TESTS=1 playwright test e2e/order-submit.spec.ts
e2e/menu-availability.spec.ts --project=mobile`: 5 passed on a production build.
- `pnpm typecheck`, ESLint and Prettier: clean.
- Full `pnpm verify`: run by `pnpm t:pr`; see CI.
- **Not verified:**
  - **Lighthouse 95.** Mobile scored 95, 93 and 93, with Accessibility 100 and CLS 0, at a load average of about 23.
  - **Page weight.** 412 KB against the PRD's 200 KB. The unchanged table form loads the same 161 KB of JavaScript and
    188 KB of fonts, so this predates the ticket and deserves its own ticket.
  - **Devices.** WhatsApp in-app browsers and real phones on venue Wi-Fi (TICKET-138, TICKET-201).

# Risks and rollout

- No schema, migration, dependency, CI or RLS changes.
- **Ordering is live for any confirmed table once merged.** There's no admin open/close switch (TICKET-080) or limits
  and cooldown (TICKET-073) yet, and no kitchen or bar board shows orders yet. Fine before the event, but those must
  land before guests use it.
- Each order writes its station rows now because the schema requires them; TICKET-074's tests and grouped confirmation
  remain.
- To roll back, revert this PR. Stored test orders are local only.

# Screenshots

`docs/reviews/TICKET-072/<theme>/<width>-sent.png` and `-failed.png` cover Ivory & Gold, Midnight & Champagne, Emerald
Night and Blush & Sage at 375, 768 and 1280px.

# UI checklist

Recorded item by item in `docs/reviews/TICKET-072/REVIEW.md`.

- **Pass:** screenshots, tokens, typography, mobile, keyboard, contrast, load (CLS 0), copy (the sent line is PRD copy;
  the rest is provisional), shared components.
- **N/A:** motion, QR, staff feedback.
- **Not verified:** Lighthouse 95 and the 200 KB budget, WhatsApp and devices.

# Harness changes, if any

None.
