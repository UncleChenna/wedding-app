-- TICKET-027 / ADR 0023: the only browser read path is a private Realtime Broadcast channel per
-- staff station. Public tables keep RLS on with no policies, so browser keys read and change
-- nothing. A staff token carrying `staff_station` may receive broadcasts on `station:<station>`
-- only; no policy lets a browser send. Plain Postgres (CI) has no Realtime or Auth schema, so the
-- policy is created only where both exist.
DO $$
BEGIN
  IF to_regclass('realtime.messages') IS NOT NULL
    AND to_regprocedure('auth.jwt()') IS NOT NULL
    AND to_regprocedure('realtime.topic()') IS NOT NULL
    AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated')
  THEN
    EXECUTE $policy$
      CREATE POLICY staff_station_broadcast_receive ON realtime.messages
      FOR SELECT TO authenticated
      USING (
        realtime.messages.extension = 'broadcast'
        AND (SELECT auth.jwt() ->> 'staff_station') IN ('gate', 'kitchen', 'bar')
        AND (SELECT realtime.topic()) = 'station:' || (SELECT auth.jwt() ->> 'staff_station')
        AND realtime.messages.topic = (SELECT realtime.topic())
      )
    $policy$;
  END IF;
END;
$$;
