-- REVIEW PROPOSAL ONLY. Not an applied or generated migration.
-- Generate the final custom migration through Drizzle after the migration base is settled.
-- Run backfill before installing append-only guards. No client RLS policies are granted.

CREATE FUNCTION "public"."admission_allowance"(invitation uuid)
RETURNS integer LANGUAGE plpgsql SET search_path = pg_catalog AS $$
DECLARE reply jsonb; allowance integer;
BEGIN
  -- Application writers lock the invitation first, then RSVP, then counter.
  PERFORM 1 FROM "public"."invitations" WHERE id = invitation FOR UPDATE;
  SELECT to_jsonb(r) INTO reply FROM "public"."rsvps" r
    WHERE invitation_id = invitation FOR UPDATE;
  IF reply IS NULL THEN RETURN 0; END IF;
  IF reply ? 'count_attending' THEN
    IF (reply->>'attending')::boolean THEN
      RETURN (reply->>'count_attending')::integer;
    END IF;
    RETURN 0;
  END IF;
  -- Bootstrap compatibility is only for the separately tested legacy import path.
  IF reply->>'status' = 'attending' THEN
    SELECT count(*)::integer INTO allowance FROM "public"."guests"
      WHERE invitation_id = invitation;
    RETURN allowance;
  END IF;
  RETURN 0;
END;
$$;

CREATE FUNCTION "public"."guard_admission_counter"()
RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog AS $$
DECLARE allowance integer; event_total integer;
BEGIN
  allowance := "public"."admission_allowance"(NEW.invitation_id);
  IF NEW.allowance <> allowance THEN
    RAISE EXCEPTION 'Admission allowance does not match RSVP' USING ERRCODE = '23514';
  END IF;
  SELECT coalesce(sum(admitted_people), 0)::integer INTO event_total
    FROM "public"."scan_events" WHERE invitation_id = NEW.invitation_id;
  IF NEW.admitted_people <> event_total THEN
    RAISE EXCEPTION 'Canonical count does not match admitted evidence' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF NEW.invitation_id <> OLD.invitation_id OR NEW.admitted_people < OLD.admitted_people THEN
      RAISE EXCEPTION 'Canonical admissions cannot be discarded' USING ERRCODE = '23514';
    END IF;
  END IF;
  -- The table CHECK also enforces 0 <= admitted_people <= allowance.
  RETURN NEW;
END;
$$;

CREATE TRIGGER admission_counter_guard BEFORE INSERT OR UPDATE
ON "public"."admission_counters" FOR EACH ROW
EXECUTE FUNCTION "public"."guard_admission_counter"();

CREATE FUNCTION "public"."sync_admission_allowance"(invitation uuid)
RETURNS void LANGUAGE plpgsql SET search_path = pg_catalog AS $$
DECLARE resolved_allowance integer;
BEGIN
  resolved_allowance := "public"."admission_allowance"(invitation);
  UPDATE "public"."admission_counters"
    SET allowance = resolved_allowance, updated_at = clock_timestamp()
    WHERE invitation_id = invitation;
  -- A reduction below canonical admissions fails the counter CHECK and rolls back the RSVP/guest write.
END;
$$;

CREATE FUNCTION "public"."refresh_admission_allowance"()
RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog AS $$
BEGIN
  IF TG_OP <> 'INSERT' THEN
    PERFORM "public"."sync_admission_allowance"(OLD.invitation_id);
  END IF;
  IF TG_OP <> 'DELETE' THEN
    IF TG_OP = 'INSERT' OR NEW.invitation_id IS DISTINCT FROM OLD.invitation_id THEN
      PERFORM "public"."sync_admission_allowance"(NEW.invitation_id);
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER rsvp_admission_allowance AFTER INSERT OR UPDATE OR DELETE
ON "public"."rsvps" FOR EACH ROW
EXECUTE FUNCTION "public"."refresh_admission_allowance"();

-- Modern RSVP count is authoritative; bootstrap RSVP derives its count from guests.
CREATE TRIGGER guest_admission_allowance AFTER INSERT OR UPDATE OR DELETE
ON "public"."guests" FOR EACH ROW
EXECUTE FUNCTION "public"."refresh_admission_allowance"();

CREATE FUNCTION "public"."reject_admission_evidence_mutation"()
RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog AS $$
BEGIN
  RAISE EXCEPTION 'Admission evidence is append-only' USING ERRCODE = '42501';
END;
$$;

CREATE TRIGGER scan_events_append_only BEFORE UPDATE OR DELETE OR TRUNCATE
ON "public"."scan_events" FOR EACH STATEMENT
EXECUTE FUNCTION "public"."reject_admission_evidence_mutation"();

CREATE TRIGGER admission_counters_no_removal BEFORE DELETE OR TRUNCATE
ON "public"."admission_counters" FOR EACH STATEMENT
EXECUTE FUNCTION "public"."reject_admission_evidence_mutation"();

-- TRUNCATE does not invoke row-level RSVP/guest triggers. Refuse it while counters exist
-- rather than allowing the backing allowance to disappear. Retention is a separate operation.
CREATE FUNCTION "public"."guard_admission_source_truncate"()
RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM "public"."admission_counters") THEN
    RAISE EXCEPTION 'Cannot truncate admission allowance sources' USING ERRCODE = '42501';
  END IF;
  RETURN NULL;
END;
$$;
CREATE TRIGGER rsvp_admission_no_truncate BEFORE TRUNCATE ON "public"."rsvps"
FOR EACH STATEMENT EXECUTE FUNCTION "public"."guard_admission_source_truncate"();
CREATE TRIGGER guest_admission_no_truncate BEFORE TRUNCATE ON "public"."guests"
FOR EACH STATEMENT EXECUTE FUNCTION "public"."guard_admission_source_truncate"();


-- Event insertion owns counter updates; reconciliation must not increment a second time.
CREATE FUNCTION "public"."count_admitted_scan"()
RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog AS $$
DECLARE allowance integer; event_total integer;
BEGIN
  IF NEW.admitted_people = 0 THEN RETURN NULL; END IF;
  allowance := "public"."admission_allowance"(NEW.invitation_id);
  SELECT coalesce(sum(admitted_people), 0)::integer INTO event_total
    FROM "public"."scan_events" WHERE invitation_id = NEW.invitation_id;
  INSERT INTO "public"."admission_counters" (invitation_id, allowance, admitted_people)
    VALUES (NEW.invitation_id, allowance, event_total)
    ON CONFLICT (invitation_id) DO UPDATE
      SET allowance = EXCLUDED.allowance, admitted_people = EXCLUDED.admitted_people,
          updated_at = clock_timestamp();
  -- Counter CHECK rejects the whole attempted insert if canonical allocation exceeds allowance.
  -- Offline reconciliation must first lock the invitation and allocate min(reported, remaining),
  -- then insert excess reports with zero/lower canonical count and conflict=true.
  RETURN NULL;
END;
$$;
CREATE TRIGGER scan_events_count_admissions AFTER INSERT ON "public"."scan_events"
FOR EACH ROW EXECUTE FUNCTION "public"."count_admitted_scan"();
