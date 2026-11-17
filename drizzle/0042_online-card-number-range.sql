ALTER TABLE "invitations" ALTER COLUMN "card_number" SET START WITH 151;--> statement-breakpoint
-- Reserve 001–150 for printed cards without renumbering any existing identifiers.
-- SET START affects RESTART, not the current counter, so advance it explicitly.
-- Retain a larger sequence value to avoid reusing numbers consumed by rolled-back writes.
SELECT setval(
  pg_get_serial_sequence('public.invitations', 'card_number'),
  GREATEST(
    150,
    COALESCE((SELECT MAX(card_number) FROM public.invitations), 0),
    (SELECT last_value FROM public.invitations_card_number_seq)
  ),
  true
);
