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

## TICKET-085 production sender — 2026-11-13

The production route now uses a configured WhatsApp Cloud API template sender. The historical logging
sender is retained for development only; it is no longer used by the route. Missing or incomplete
provider configuration returns 503 before consuming any pending alert.

This supersedes the original network-inside-transaction production delivery guarantee. The drain
locks pending rows, selects one due message (whole order lines, up to 1024 characters), snapshots
opted-in recipients, and commits a `failed` reservation before contacting Meta. It then marks the
reserved rows `sent` only when every distinct recipient number receives API acceptance. The next
drain cannot claim these rows again. A crash, timeout, partial acceptance or failed acceptance write
leaves a visible failure, including the unavoidable crash-before-send window. The board remains the
source of truth; there is no automatic retry of an uncertain POST and no exactly-once delivery claim.
An individual order exceeding the template limit is visibly failed without truncation or HTTP.
Later messages remain pending for later scheduled ticks. Large backlogs may exceed the original
60-second notification target; this must be checked in the staff-phone/load rehearsal.

Explicit structured transient Graph rejections allow at most three retries (four requests), with
500/1000/2000ms backoff and bounded Retry-After handling. A bare HTTP500, malformed acceptance,
transport failure or timeout is uncertain and is never automatically retried. A drain has a 20-second
provider budget inside a 30-second route allowance. Every attempt rechecks recorded opt-in and
revocation for that station/phone; duplicate staff records sharing a phone get one message. The
final consent check and external provider acceptance cannot be one atomic transaction.

Use an approved utility template with exactly one body text parameter; the sender flattens newlines
and tabs to spaces, without truncating instructions. The API version is explicit configuration, not
a guessed future default. No callback endpoint is added: asynchronous provider delivery receipts are
not certified by this implementation, and repeated callbacks cannot trigger another send. Staff UI
uses neutral "recorded as sent" wording because older logging-only rows also used `sent`; API
acceptance itself does not establish delivery on a phone.

Provider configuration is server-only and documented in `.env.example`. No live account, message,
payment or migration is created by this ticket. Deployment starts disabled; enable only after
TICKET-083 supplies the account, approved template and opted-in staff test recipient. Rollback:
clear provider configuration or remove the schedule; orders and board access continue. Preserve
failed rows for investigation and do not mass-reset them to pending.

References: [Meta template messages](https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/template-messages),
[Meta error codes](https://developers.facebook.com/documentation/business-messaging/whatsapp/support/error-codes).
The error-code reference was reviewed on 2026-11-13; the template page rate-limited automated access.
Live template compatibility and phone receipt remain mandatory setup evidence, not a claimed result.
