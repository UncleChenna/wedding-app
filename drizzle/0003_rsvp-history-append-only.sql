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
