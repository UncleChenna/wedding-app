# Ticket

Ticket: TICKET-033

# Summary

Kitchen and bar boards must show a new order within 2 seconds (ORD-4), and gate scanners must see each other's
check-ins (CHK-7). This adds the live-update plumbing that ADR 0024 (TICKET-027) approved.

- Each signed-in station device gets a short-lived Realtime token from the server.
- Only the server publishes, inside the write's transaction.
- A browser helper subscribes, refreshes its token, reconnects, and asks the screen to refetch on every rejoin,
  so a dropped connection never leaves a gap.

**Stacked on #117 (TICKET-027):** this branch includes its migration and ADR. Merge #117 first; this diff then
shrinks to TICKET-033's own changes.

# Changes

- **`src/modules/shared/lib/realtime-channels.ts`** (new): the station topics (`station:gate|kitchen|bar`) and the
  payload contract.
  - Kitchen and bar get `order.changed`: station order id, order id, status.
  - Gate gets `checkin.recorded`: invitation id, admitted, conflict.
  - The schemas are strict: no names and no dietary notes. Screens refetch details through their own REST
    projection.
- **`src/modules/shared/server/realtime-token.ts`**, **`realtime-token-response.ts`**, **`realtime-token-route.ts`**
  and `POST /api/{checkin,kitchen,bar}/realtime-token` (new):
  - Each request rechecks the live staff, device, credential and event expiry.
  - The token: 10-minute HS256, role `authenticated`, `sub` set to the device id, and a `staff_station` claim.
  - No session gets 403. No secret configured gets 503 ("Live updates are off"). Responses are `private, no-store`.
- **`src/modules/shared/server/realtime-publish.ts`** (new), `publishToStation`:
  - It validates the payload against the station's contract, then calls `realtime.send` in the caller's
    transaction, so it's delivered only on commit.
  - It does nothing on plain Postgres (CI).
- **`src/modules/ordering/server/create-order.ts`:** publishes `order.changed` for each station ticket of a new
  order.
- **`src/modules/shared/lib/station-channel.ts`** (new), `subscribeStation`:
  - It joins the private topic and checks each message against the contract.
  - It refreshes the token a minute before expiry, and stops as `signed-out` on a 401 or 403.
  - On an error, timeout or close, it refetches and rejoins with backoff (1, 2, 5, 10 and 30 s).
  - It calls `onResync` on every (re)subscribe, and on each retry while live updates are unavailable.
- **`src/modules/shared/lib/station-client.ts`** (new): a Supabase client using the `accessToken` option, so the
  unused Auth module can't swap the station token back to the publishable key.
- **Env:** a new optional `SUPABASE_JWT_SECRET` (schema, `.env.example`). `pnpm db:start` fills in the local
  stack's value.
- **Tests:**
  - `src/modules/shared/__tests__/realtime.test.ts` (new): 10 unit tests.
  - `scripts/__tests__/realtime-stations.integration.test.ts` (new).
  - `scripts/__tests__/rls-policies.integration.test.ts`: its broadcast probe now uses a per-run event name, so real
    messages left by Realtime use can't be mistaken for its rows.
  - The env test now expects the new default.
- **Docs:** ADR 0024's validation note, an `architecture.md` paragraph, and the ticket notes.

# Acceptance criteria and evidence

- [x] **A write appears on a subscribed client within 2 s locally (e2e timing assertion).**
  - Two kitchen screens and one bar screen, each a real Realtime client running `subscribeStation`, wait until
    live.
  - Then `createOrder` places a kitchen order. Both kitchen screens receive `order.changed` with the order id in
    under 2,000 ms, measured from before the write. The bar receives nothing.
  - **Not a browser:** these clients use Node's WebSocket. There's no board UI to drive yet (out of scope); the
    board tickets add the browser-context check.
- [x] **Guests can't subscribe to staff channels (tested).**
  - The publishable key alone gets `CHANNEL_ERROR` on `station:kitchen`.
  - A gate token on the kitchen topic, and a token signed with the wrong secret, never go live and receive no
    orders.
  - The gate token does go live on `station:gate`.
  - The token route answers 403 without a station session.
- [x] **After a dropped connection, the client refetches and shows no gaps.**
  - The test cuts a live kitchen screen's socket and places an order while it's down.
  - The screen goes `reconnecting` and refetches, then refetches again when it rejoins (at least 2 resyncs). The
    missed order is in the refetched open tickets, even though its broadcast never arrived.
  - After that, a new order arrives live within 2 s.
- [x] **Gate, bar and anonymous subscribers never receive dietary notes or other households** (carried over from
      TICKET-027):
  - The unit tests refuse `dietaryNotes`, `guestName`, `notes` and `householdName` on publish and on receive.
  - `publishToStation` throws before touching the database.

# Verification

- `RUN_REALTIME_DB_TESTS=1 vitest run scripts/__tests__/realtime-stations.integration.test.ts`: 3 passed on three
  consecutive runs, on this worktree's local Supabase stack.
- `RUN_RLS_DB_TESTS=1` and `RUN_ORDER_SUBMIT_DB_TESTS=1` with `rls-policies` and `create-order`: all passed, on a
  migrated and seeded stack.
- `vitest run src/modules/shared src/modules/ordering scripts/__tests__`: 613 passed.
- `pnpm typecheck` and ESLint on the changed paths: clean.

# Not tested and limitations

- **No browser-context test** (see the first criterion).
- **No check-in events yet:** `checkin.recorded` is defined, but nothing publishes it until the gate write paths
  land (TICKET-061, and #136 for TICKET-173).
- **Revocation can take up to 10 minutes** to stop a device's live updates: the token's lifetime. Every refresh
  rechecks access.
- **Production needs `SUPABASE_JWT_SECRET`:** the project's legacy JWT secret (or an imported shared-secret signing
  key) in the deployment's secrets. Until then, the token route answers 503 and screens fall back to refetching.

# Risks and rollout

- No new migration of its own; it uses TICKET-027's policy.
- **Rollback:** revert the PR. Orders then stop publishing, and nothing else changes.

# Screenshots

N/A: no UI (board UIs are out of scope).

# UI checklist

N/A: no UI.

- [x] **Verification:** see above.

# Harness changes, if any

`scripts/db-local.mjs` writes `SUPABASE_JWT_SECRET` from the local stack's status into `.env.local`, alongside the
keys it already writes.
