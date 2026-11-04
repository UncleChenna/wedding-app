# 0022 — Order alert outbox and scheduled drain

- Status: Proposed · 2026-11-04

**Context.** Every order should alert the kitchen or bar lead on WhatsApp (PRD ORD-9). When busy, alerts batch per
station so phones aren't flooded, and the board stays the source of truth. TICKET-084 requires that three orders in a
minute produce one message per station, that a failed alert never blocks an order, and that the last pending batch goes
out on time even when no further request arrives, so flushing on incoming requests alone isn't enough. Vercel Hobby cron
runs at most daily. The database host for production is still open (Supabase as planned in TICKET-144, or Neon).

**Decision (proposed).**

1. **Outbox table, written with the order.** `createOrder` inserts one `order_alerts` row per station ticket in the
   same transaction as the order: id, station, created time, message text, status (`pending`, `claimed`, `sent`,
   `failed`), attempts, and the last attempt time. A committed order always has its alert; an alert never exists for a
   rolled-back order. RLS on, no browser policies.
2. **Batching.** A station's batch is due once its oldest pending alert has waited 50 seconds. Every pending alert for
   that station goes in one message, one line per order. A quiet station therefore still gets one message per order.
3. **Drain every 10 seconds, scheduled by the database.** A drain claims pending rows (`FOR UPDATE SKIP LOCKED`, so
   overlapping drains never double-send), sends the due batches, marks them sent, and returns the rest. 50 + 10 means no
   alert waits more than 60 seconds. The drain runs at a secret-protected `POST /api/alerts/drain`, called on a
   schedule from the database:
   - On **Supabase**: `pg_cron` every 10 seconds with `pg_net` making the HTTP call. Both are available on the free
     plan.
   - On **Neon**: `pg_cron` is supported, but the compute must not scale to zero during the event, and outbound HTTP
     needs checking before this is relied on.
4. **Failure.** A failed send returns the batch to pending for the next tick. After 5 attempts it's marked `failed`
   and left for the admin health page (TICKET-143). Sending happens after the order commits, so a provider outage only
   delays alerts. The message text is never logged, because it can include a guest's note.
5. **Providers.** A dry-run sender records messages in development and tests. The WhatsApp provider is TICKET-085.

Rejected:

- **Request-time flush only:** the last batch would wait for the next order.
- **Vercel cron:** daily on Hobby, and one-minute granularity on paid plans.
- **GitHub Actions schedules:** five-minute minimum and best-effort timing.
- **Sending inside the order transaction:** a slow or failing provider would block orders.

**Consequences.**

- Adds one table and a migration, which needs the owner's exact-path approval.
- Adds a `CRON_SECRET`-style environment variable.
- Ties the scheduler to the production database choice.
- The drain is the only sender, so turning it off silences alerts without touching ordering.
- To reverse, drop the schedule; orders keep working.

**Validation.**

- Pure batching, formatting, drain, retry and give-up logic are unit-tested with a fake clock and an in-memory outbox
  that has the same claim semantics (`src/modules/ordering/__tests__/alerts.test.ts`).
- **Not yet validated:**
  - the table and migration
  - wiring enqueue into `createOrder`
  - `SKIP LOCKED` claiming against Postgres
  - the drain route
  - the schedule on the chosen host
