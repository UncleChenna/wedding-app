# Ticket

Ticket: TICKET-027

# Summary

RLS was on for every table with no policies, and no ADR said who may read what. The kitchen, bar and gate devices
will need live updates (TICKET-033) without browsers ever reading dietary notes or other households.

This PR decides and enforces that in ADR 0023:

- **Tables:** browsers read and write no application table. The anon key and every signed-in token, whatever its
  claims, get zero rows from all 21 public tables.
- **Live updates:** the only browser read path is a private Realtime Broadcast channel per station, through one
  receive-only policy. A token with `staff_station: kitchen` can listen on `station:kitchen` and nothing else, and it
  can't send.

**Needs owner approval:** this is an RLS policy change, so ADR 0023 is Proposed until an owner approves this PR.

# Changes

- **`drizzle/0020_rls-station-broadcast.sql`** (custom migration): creates `staff_station_broadcast_receive` on
  `realtime.messages`, for `SELECT` by `authenticated` only. A row is visible only when all of these hold:
  - extension is `broadcast`
  - the `staff_station` claim is gate, kitchen or bar
  - the joined topic is `station:<claim>`
  - the message's own topic matches the joined topic

  The policy is created only where the `realtime` and `auth` schemas and the `authenticated` role exist. CI's plain
  Postgres has none of them, so there it does nothing.

- **`docs/decisions/0023-rls-least-privilege.md`:** a table-by-table access matrix, the channel rules, how
  TICKET-033 mints the staff token, the projection rules (no dietary notes for gate or bar), consequences and
  reversal. Indexed in the decisions README; `docs/architecture.md` updated.
- **`scripts/__tests__/rls-policies.integration.test.ts`** (opt-in with `RUN_RLS_DB_TESTS=1`, needs the local
  Supabase stack).

# Acceptance criteria and evidence

- [ ] **ADR approved by an owner in the PR review:** waiting on your review.
- [x] **The anon key gets zero rows from every table; a staff claim reads only permitted columns.** Five actors are
      each run against every public table: anon, a signed-in token without a station, and gate, kitchen and bar
      tokens. Each reads 0 rows and deletes 0 rows, on seeded data that includes guests with dietary notes, in
      rolled-back transactions. Staff tokens read no table columns at all.
- [x] **Dietary notes aren't readable through any browser policy except kitchen staff.** Every actor gets nothing
      from a `guests` and `invitations` join or from a guessed guest id. Kitchen-only dietary data travels only in
      server-built kitchen broadcasts (ADR 0023, TICKET-033).
- [ ] **RLS and Realtime grants enforce role access, and server projections omit private columns:**
  - The RLS and Realtime half is done and tested. Each station receives only its own channel; anon, a token without
    a claim and an `admin` claim receive nothing; a station's insert is refused by RLS; no public table is in a
    Realtime publication.
  - The projection half needs the broadcast payloads, which TICKET-033 builds.

# Verification

- **`pnpm db:reset`** on this worktree's stack: migrations and seed are clean. `pnpm db:migrate` reruns with only
  Postgres notices. `pnpm db:check-rls`: RLS is on for all 21 public tables.
- **`RUN_RLS_DB_TESTS=1 vitest run scripts/__tests__/rls-policies.integration.test.ts`: 11 passed.**
  - The first run caught a gap: a gate token could read rows on the other stations' topics. The policy now also
    matches each row's topic, and that test passes.
- **CI:** `verify:quick` runs in `t:pr`. CI's full `pnpm verify` and the migrations job run the migration on plain
  Postgres, where it does nothing.
- **Not verified:** a live Realtime subscription with a minted token. That arrives with TICKET-033.

# Risks and rollout

- **Production:** production's Supabase has the `realtime` and `auth` schemas, so the policy is created there on
  migrate. Nothing uses it until TICKET-033.
- **Rollback:** `DROP POLICY staff_station_broadcast_receive ON realtime.messages;`. Browsers then receive nothing and
  server features are unaffected.

# Screenshots

N/A: database policy and docs only.

# UI checklist

N/A: no UI.

- [x] **Verification:** see above.

# Harness changes, if any

None.
