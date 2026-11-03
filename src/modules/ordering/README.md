# ordering

Table ordering: guests enter their table number and order free food/drinks (`menu_items`, `orders`, `order_items`, `tables`); kitchen and bar see a live board per station. Routes: `src/app/(guest)/order`, `src/app/(staff)/kitchen`.

## Frontend preview

`/dev/order` uses sample tables/menu and in-memory state. Filters, quantities, notes, review and Received/Served simulations send no order requests. Production table lookup, availability, persistence, idempotency and kitchen/bar updates remain separate integration work. See TICKET-200 and its UI review.

## Table selection

`/order` validates a positive integer against `tables` through Drizzle without sign-in or an invitation credential. A successful Server Action stores only the canonical table number in an HttpOnly, SameSite=Lax session cookie scoped to `/order` (Secure in production). Every render revalidates that cookie; it is a convenience, never authorization or proof that a table exists when an order is submitted.

Unknown, malformed and unavailable selections leave the previous cookie unchanged. Error redirects use fixed codes and the submitted public table number, so native forms display the same errors without JavaScript. The route waits for request data to render usable HTML instead of a JavaScript-revealed streaming fallback. A change link returns to the form; a fresh browser session has no selection.

TICKET-070 ends at table confirmation. Menu browsing (TICKET-071), availability and order submission remain separate work; the page explicitly says the menu is not open. Future order writes must revalidate the table and menu at submission time.
