# TICKET-025 migration approval packet

Historical approval packet: generation was subsequently approved and committed in e72852a. The committed migration and local repeatability/constraint evidence were verified on 28 October; see [verification](verification.md). The proposal below is preserved for review.

## Generated outputs requested

Run `pnpm db:generate --name event-settings-rsvp-history`, then `pnpm db:generate --custom --name rsvp-history-append-only`. The installed generator writes a snapshot even for a custom migration. Current journal ends at 0001.

- `drizzle/0002_event-settings-rsvp-history.sql`
- `drizzle/meta/0002_snapshot.json`
- `drizzle/0003_rsvp-history-append-only.sql`
- `drizzle/meta/0003_snapshot.json`
- `drizzle/meta/_journal.json`

Record the authorization in this worktree's ignored `.harness/approved-writes.json`; never commit that file. Snapshots and journal are generator-owned. Fill only the newly generated custom SQL file with the reviewed SQL below. No applied migration is edited.

## Additive table migration

The schema source adds event_settings and rsvp_changes, both with RLS enabled and no browser policies. Existing tables and data are untouched. The settings primary key is constrained to 1, allowing an absent draft row or one stored row. Names/date and policy defaults reflect owner decisions; unknown venue/time-zone/cutoff remain null. Bounds protect tag-alongs, retention and order limits. An RSVP cutoff requires a configured time zone.

History links to invitations with RESTRICT, not CASCADE; JSON snapshots must be objects, actor nonblank and timestamp non-null. No history is backfilled or guest data deleted.

## Custom SQL for new migration

```sql
CREATE FUNCTION public.reject_rsvp_history_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  RAISE EXCEPTION 'RSVP history is append-only' USING ERRCODE = '42501';
END;
$$;

CREATE TRIGGER rsvp_history_append_only
BEFORE UPDATE OR DELETE OR TRUNCATE ON public.rsvp_changes
FOR EACH STATEMENT EXECUTE FUNCTION public.reject_rsvp_history_mutation();

REVOKE UPDATE, DELETE, TRUNCATE ON TABLE public.rsvp_changes FROM PUBLIC;

DO $$
DECLARE runtime_role text;
BEGIN
  FOR runtime_role IN
    SELECT rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated', 'service_role')
  LOOP
    EXECUTE format(
      'REVOKE UPDATE, DELETE, TRUNCATE ON TABLE public.rsvp_changes FROM %I',
      runtime_role
    );
  END LOOP;
END;
$$;
```

The trigger also rejects ordinary table-owner mutations. An administrator can always change DDL; this is not tamper-proof storage against a database administrator. Retention/purge needs a separately authorized maintenance procedure in TICKET-127 rather than silent cascades or a runtime delete grant. Runtime role revocations are conditional so vanilla CI Postgres remains supported.

## Evidence and next checks

15 typed-default/accessor tests pass. Five real database tests fail against the old database because the new tables do not exist, proving the regressions are active. Source typecheck passes. After approval: inspect generated SQL, apply twice in isolated project wedding-c4ce5584db6b, compare full counts, verify RLS and role grants, run all five regressions and repeatable seed, then full verification and CI. No production execution is authorized here.

Rollback: restore the previous application while retaining new tables/history. Any destructive down migration or history purge requires separate approval.
