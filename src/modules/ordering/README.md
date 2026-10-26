# ordering

Table ordering: guests enter their table number and order free food/drinks (`menu_items`, `orders`, `order_items`, `tables`); kitchen and bar see a live board per station. Routes: `src/app/(guest)/order`, `src/app/(staff)/kitchen`.

## Frontend preview

`/dev/order` uses sample tables/menu and in-memory state. Filters, quantities, notes, review and Received/Served simulations send no order requests. Production table lookup, availability, persistence, idempotency and kitchen/bar updates remain separate integration work. See TICKET-200 and its UI review.
