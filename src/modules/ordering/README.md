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

Polling, not Supabase Realtime: Realtime on `menu_items` needs an anonymous read policy, which is an RLS change requiring an ADR. Availability on the page is display only; order submission (TICKET-074) must revalidate every item at commit time. Quantities are local until the cart (TICKET-072). No photos yet: `menu_items` has no image column.
