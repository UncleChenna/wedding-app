-- Fill details printed on the invitation card only where an existing row left them blank.
-- Values an admin already saved are kept.
UPDATE "event_settings" SET
  "ceremony_time" = coalesce("ceremony_time", '12:00'),
  "time_zone" = coalesce("time_zone", 'Africa/Lagos'),
  "venue" = coalesce("venue", 'St Paul''s Anglican Church, Apo Resettlement, Abuja'),
  "rsvp_lock_at" = coalesce("rsvp_lock_at", '2026-12-17 23:59:00+01');
