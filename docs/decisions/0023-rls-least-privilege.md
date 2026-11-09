# 0023 — Row-level security: server-only tables and per-station broadcast channels

- Status: Accepted · 2026-11-09 (TICKET-027). Approved by the owner (UncleChenna) on 2026-11-09.

**Context.** Every public table has RLS enabled with no policies (ADR 0002). Kitchen, bar and gate devices will
need live updates (TICKET-033), and the PRD's privacy rules forbid browsers from reading other households or
dietary notes unless they're kitchen staff. Staff sign in with a PIN-backed session cookie, not Supabase Auth, so
no browser has an Auth user today. There are two ways for a browser to get live updates through Supabase:

- **Postgres Changes:** subscribe to a table. This needs a `SELECT` policy on that table, returns whole rows, and RLS
  can't hide individual columns.
- **Broadcast:** the server publishes a message it has already shaped. A private channel is authorised by a policy
  on `realtime.messages`.

**Decision.** Browsers never read or write application tables. The only browser read path is a private Broadcast
channel per staff station.

1. **Tables.** No policy on any public table. The publishable (`anon`) key and any `authenticated` token, whatever
   its claims, read, change and delete zero rows. All application data goes through server code on `DATABASE_URL`,
   which validates input with Zod and builds the projection each screen needs.

   | Tables                                                                                               | Browser access | Server access                  |
   | ---------------------------------------------------------------------------------------------------- | -------------- | ------------------------------ |
   | `invitations`, `guests`, `rsvps`, `rsvp_changes`, `invitation_lifecycle_events`, `invitation_photos` | none           | guest and admin server actions |
   | `tables`, `menu_items`, `orders`, `order_items`, `station_orders`, `order_alerts`                    | none           | ordering, boards, alert drain  |
   | `check_ins`, `scan_events`, `admission_counters`                                                     | none           | gate server actions            |
   | `staff`, `staff_pin_attempts`, `registered_devices`                                                  | none           | staff sign-in and admin        |
   | `event_settings`, `themes`, `request_budgets`                                                        | none           | settings, theming, rate limits |

   `rsvp_changes` stays append-only for every role (migration 0003). A new table gets RLS with no policy
   (`pnpm db:check-rls` fails otherwise) and joins this table in the same PR.

2. **Realtime.** One policy, `staff_station_broadcast_receive` on `realtime.messages`, for `authenticated` and
   `SELECT` only. It lets a token whose `staff_station` claim is `gate`, `kitchen` or `bar` receive Broadcast messages
   on `station:<that station>`, and nothing else:
   - no other topic
   - no Presence
   - no sending: there is no `INSERT` policy, so only the server, with the service role, publishes

   TICKET-033 mints the token server-side after the PIN session is checked: role `authenticated`, `sub` set to the
   device id, a `staff_station` claim, and an expiry no later than the staff session's.

3. **Projections.** Payloads are built by server code per station. Gate and bar payloads never include
   `dietary_notes` or other guests' details; kitchen payloads may carry the dietary notes for the order's guests.
   Postgres Changes stays unused: no public table is in a Realtime publication.

**Consequences.**

- **Least privilege:** a leaked publishable key or staff token exposes no table data. A staff token can only listen
  to its own station.
- **Payload privacy depends on server code.** The projections are ordinary code reviewed in TICKET-033, not database
  rules, so that ticket must test each station's payload.
- **Some live features need a broadcast.** Guest-facing live data (menu availability) keeps polling, or gets its own
  broadcast topic through a new ADR. Adding a table `SELECT` policy also needs a new ADR.
- **CI and the local stack differ.** Plain Postgres (CI) has no `realtime` or `auth` schema, so the migration creates
  the policy only where they exist. The local Supabase stack and production both have them.
- **Reversal:** drop the policy (`DROP POLICY staff_station_broadcast_receive ON realtime.messages`). Browsers then
  receive nothing, and the server keeps working.

**Validation.** `RUN_RLS_DB_TESTS=1 vitest run scripts/__tests__/rls-policies.integration.test.ts` on a seeded local
stack checks:

- no public policies
- zero rows read, changed or deleted in every public table for anon, a plain signed-in token and each station token
- no dietary notes through joins or a guessed id
- no published tables
- each station receives only its own channel
- anon, missing-claim and unknown-station tokens receive nothing
- a station can't send

Not yet verified: a live Realtime subscription with a minted token (TICKET-033).
