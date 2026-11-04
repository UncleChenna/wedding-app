# ordering

Table ordering: guests enter their table number and order free food/drinks (`menu_items`, `orders`, `order_items`, `tables`); kitchen and bar see a live board per station. Routes: `src/app/(guest)/order`, `src/app/(staff)/kitchen`.

## Frontend preview

`/dev/order` uses sample tables/menu and in-memory state. Filters, quantities, notes, review and Received/Served simulations send no order requests. Production table lookup, availability, persistence, idempotency and kitchen/bar updates remain separate integration work. See TICKET-200 and its UI review.

## Table selection

`/order` validates a positive integer against `tables` through Drizzle without sign-in or an invitation credential. A successful Server Action stores only the canonical table number in an HttpOnly, SameSite=Lax session cookie scoped to `/order` (Secure in production). Every render revalidates that cookie; it is a convenience, never authorization or proof that a table exists when an order is submitted.

Unknown, malformed and unavailable selections leave the previous cookie unchanged. Error redirects use fixed codes and the submitted public table number, so native forms display the same errors without JavaScript. The route waits for request data to render usable HTML instead of a JavaScript-revealed streaming fallback. A change link returns to the form; a fresh browser session has no selection.

TICKET-070 ends at table confirmation. Menu browsing (TICKET-071), availability and order submission remain separate work; the page explicitly says the menu is not open. Future order writes must revalidate the table and menu at submission time.

## Menu and live availability

After a table is confirmed, `/order` renders `menu_items` on the server, grouped as Meals, Soft drinks and Alcoholic drinks (empty categories hidden; items by `sort_order`, then name). Only guest-safe fields leave the server: station and timestamps do not.

`MenuSections` polls `GET /api/menu/availability` every 3 seconds while the tab is visible, and once immediately on return. The endpoint is `private, no-store` and returns only `{ id, available }`. A newly sold-out item stays visible, shows "Sold out" as text tied to its quantity control, is disabled, loses any chosen quantity, and is announced in a polite live region. Failed or malformed polls keep the last known state. Items added after load appear on reload.

Polling, not Supabase Realtime: Realtime on `menu_items` needs an anonymous read policy, which is an RLS change requiring an ADR. Availability on the page is display only; order submission revalidates every item at commit time (see below). No photos yet: `menu_items` has no image column.

## Sending an order

`OrderComposer` holds the cart: quantities from the menu, a 140-character note and a Send button in the sticky `ActionBar`. Pressing Send creates one client request id (`newRequestId`). `submitOrder` posts to `POST /api/orders` and retries network failures, timeouts (10s per attempt), 408/429 and 5xx after 1s, 2s and 4s with that same id. The page says "Sending your order…", then "Still sending…" on retries, "On its way. Sit back, we've got this." on success, or a failed message with **Try again**, which reuses the id. Any edit after a failure starts a new id. Rejections are final and never retried.

`createOrder` runs in one transaction:

1. An existing order with the same `client_request_id` is a replay. The same table, note and items (in any order) return the original order; anything else is a `mismatch` (HTTP 409).
2. The table must exist and its row is locked `FOR UPDATE`, which serializes that table's submissions on every server instance. The replay check runs again after the lock (a duplicate tap that waited is still a replay), then the table limits from `event_settings` apply: a cooldown since the table's last order (measured with the database clock; the rejection carries `retryAfterSeconds`) and a cap on open orders (received, preparing or ready; served and cancelled free a slot). A mixed submission is one `orders` row, so it counts once. The chosen `menu_items` rows are read `FOR SHARE`, so a concurrent sold-out change either commits first (and the order is refused as `sold-out`) or waits for the order.
3. Every item must exist, be available and be within the smaller of its `max_per_order` and the event-wide `max_item_quantity`.
4. The order, one `station_orders` ticket per station used (`splitByStation`: kitchen first, then bar, each sharing the order id), and the `order_items` (with `quantity_limit` snapshotted) are inserted. A racing duplicate loses the unique `client_request_id` insert and answers as a replay.

The note is plain text: control and format characters become spaces, whitespace collapses, and it renders as text. Only JSON bodies up to 8 KB are accepted. Expected failures are fixed codes; database errors become a retryable 503 with nothing logged but the outcome.

Not here: live order status (TICKET-075), and the admin open/close switch (TICKET-080). The confirmation groups the order under "From the kitchen" and "From the bar"; the menu carries each item's station for that.
