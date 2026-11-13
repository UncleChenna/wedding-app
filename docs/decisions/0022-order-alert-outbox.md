# 0022 — Order alert outbox and scheduled drain

- Status: Accepted · 2026-11-06 (proposed 2026-11-04; the owner approved the migration and building on the local
  Supabase stack, with the production scheduler following the database host decision, TICKET-213)

**Context.** Every order should alert the kitchen or bar lead on WhatsApp (PRD ORD-9). When busy, alerts batch per
station so phones aren't flooded, and the board stays the source of truth. TICKET-084 requires that three orders in a
minute produce one message per station, that a failed alert never blocks an order, and that the last pending batch goes
out on time even when no further request arrives, so flushing on incoming requests alone isn't enough. Vercel Hobby cron
runs at most daily. The database host for production is still open (Supabase as planned in TICKET-144, or Neon).

**Decision.**

1. **Outbox table, written with the order.** `createOrder` inserts one `order_alerts` row per station ticket in the
   same transaction as the order: id, station, created time, message text, status (`pending`, `claimed`, `sent`,
   `failed`), attempts, and the last attempt time. A committed order always has its alert; an alert never exists for a
   rolled-back order. RLS on, no browser policies.
2. **Batching.** A station's batch is due once its oldest pending alert has waited 50 seconds. Every pending alert for
   that station goes in one message, one line per order. A quiet station therefore still gets one message per order.
3. **Drain every 10 seconds, scheduled by the database.** A drain runs in one transaction. It locks pending rows
   (`FOR UPDATE SKIP LOCKED`, so overlapping drains never double-send), sends the due batches, marks them sent, and
   commits. Rows not yet due are unlocked at commit, and a crash rolls back to pending, so nothing is stranded.
   Delivery is at least once: a send that succeeds just before a failed commit is repeated. 50 + 10 means no alert
   waits more than 60 seconds. The drain runs at `POST /api/alerts/drain`, protected by a Bearer `ALERT_DRAIN_SECRET`
   and answering 503 without one. The schedule holds each environment's URL and secret, so it's set by an ops command,
   `pnpm alerts:schedule --url …` (and `--remove`), not a migration:
   - On **Supabase**: `pg_cron` every 10 seconds with `pg_net` making the HTTP call. Both are available on the free
     plan.
   - On **Neon**: `pg_cron` is supported, but the compute must not scale to zero during the event, and outbound HTTP
     needs checking before this is relied on.
4. **Failure.** A failed send returns the batch to pending for the next tick. After 5 attempts it's marked `failed`
   and left for the admin health page (TICKET-143). Sending happens after the order commits, so a provider outage only
   delays alerts. The message text is never logged, because it can include a guest's note.
5. **Providers.** A dry-run sender records messages in tests. Until the WhatsApp provider (TICKET-085) exists, the
   route uses a logging sender that records only the station and line count and marks the batch sent.

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
- Against local Postgres (`scripts/__tests__/order-alerts.integration.test.ts`, 5 tests):
  - enqueue with the order
  - three orders giving one message per station
  - the last batch sent with no further traffic, exactly once
  - overlapping drains never double-sending
  - failure retries and the give-up after five attempts, with orders unaffected
- End to end on the local Supabase stack, 2026-11-06: `pnpm alerts:schedule` set up `pg_cron` and `pg_net`. A single
  order with no other traffic was sent by the schedule 57 seconds after it was placed.
- **Not yet validated:** the schedule on the production host, which waits on TICKET-213.
- **The secret lives in `cron.job`:** it's in the scheduled command, readable by database administrators only.
  Rotating it is one re-run of `pnpm alerts:schedule`.

## TICKET-112 — optional browser push

The same committed order-alert row now has independent push status and attempt count. The drain runs the two delivery channels independently. A WhatsApp failure cannot consume or prevent a browser notification, and push never blocks order creation. Generic notices coalesce per station and device; they contain no guest or order details.

Subscriptions belong to a signed-in staff/device/credential version, expire with that session and are filtered again against live roles, credential version, PIN validity, event expiry and revoked devices before sending. Browser endpoint destinations are allowlisted; the maintained Web Push library encrypts the payload and signs VAPID. A three-second request timeout and fifteen-second drain budget bound work. Per-device delivery watermarks let later ticks resume without repeatedly notifying successful recipients. The board remains the authoritative order view.

The feature is opt-in and unavailable without the complete server-side VAPID configuration. Permission denial leaves ordering intact. Browser delivery and physical installed-iOS evidence are distinct from isolated database tests; the latter verify persistence, retries and authorization invalidation, not external push-service availability.
