-- REVIEW PROPOSAL ONLY. Generate through Drizzle after the expansion/base is settled.
-- Install immutable/counter triggers only after this backfill succeeds in the same migration run.
-- Preserve all original check_ins rows; do not silently ignore duplicate event IDs.
LOCK TABLE "public"."invitations", "public"."rsvps", "public"."guests",
  "public"."check_ins" IN SHARE ROW EXCLUSIVE MODE;

DO $$
BEGIN
  IF (SELECT count(*) FROM "public"."check_ins") <>
     (SELECT count(*) FROM "public"."check_ins" c
       JOIN "public"."guests" g ON g.id = c.guest_id
       JOIN "public"."invitations" i ON i.id = g.invitation_id) THEN
    RAISE EXCEPTION 'Legacy check-in has no invitation mapping' USING ERRCODE = '23514';
  END IF;
END;
$$;

WITH allowances AS (
  SELECT i.id,
    CASE
      WHEN to_jsonb(r) ? 'count_attending' THEN
        CASE WHEN (to_jsonb(r)->>'attending')::boolean
          THEN (to_jsonb(r)->>'count_attending')::integer ELSE 0 END
      WHEN to_jsonb(r)->>'status' = 'attending' THEN
        (SELECT count(*)::integer FROM "public"."guests" g WHERE g.invitation_id = i.id)
      ELSE 0
    END AS allowance
  FROM "public"."invitations" i
  LEFT JOIN "public"."rsvps" r ON r.invitation_id = i.id
), ordered AS (
  SELECT c.*, g.invitation_id, d.id AS registered_device_id, a.allowance,
    row_number() OVER (
      PARTITION BY g.invitation_id ORDER BY c.checked_in_at, c.client_event_id
    ) AS admission_number
  FROM "public"."check_ins" c
  JOIN "public"."guests" g ON g.id = c.guest_id
  JOIN allowances a ON a.id = g.invitation_id
  LEFT JOIN "public"."registered_devices" d ON d.id = c.device_id
)
INSERT INTO "public"."scan_events" (
  id, client_event_id, invitation_id, staff_id, device_id,
  reported_at, received_at, reported_result, result,
  reported_people, admitted_people, conflict, source, legacy_check_in_id
)
SELECT id, client_event_id, invitation_id, staff_id, registered_device_id,
  checked_in_at, created_at, 'valid',
  CASE WHEN admission_number <= allowance THEN 'valid'::"public"."scan_result"
    ELSE 'already_used'::"public"."scan_result" END,
  1, CASE WHEN admission_number <= allowance THEN 1 ELSE 0 END,
  admission_number > allowance, 'legacy', id
FROM ordered;

WITH allowances AS (
  SELECT i.id,
    CASE
      WHEN to_jsonb(r) ? 'count_attending' THEN
        CASE WHEN (to_jsonb(r)->>'attending')::boolean
          THEN (to_jsonb(r)->>'count_attending')::integer ELSE 0 END
      WHEN to_jsonb(r)->>'status' = 'attending' THEN
        (SELECT count(*)::integer FROM "public"."guests" g WHERE g.invitation_id = i.id)
      ELSE 0
    END AS allowance
  FROM "public"."invitations" i
  LEFT JOIN "public"."rsvps" r ON r.invitation_id = i.id
)
INSERT INTO "public"."admission_counters" (invitation_id, allowance, admitted_people)
SELECT e.invitation_id, a.allowance, sum(e.admitted_people)::integer
FROM "public"."scan_events" e
JOIN allowances a ON a.id = e.invitation_id
GROUP BY e.invitation_id, a.allowance;

-- Existing unknown legacy device text stays in the untouched archive; no actor/device is invented.
-- The imported row explicitly records source=legacy and references its original row.
