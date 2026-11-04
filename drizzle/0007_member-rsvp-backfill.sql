-- Additive conversion: legacy household responses remain available to the current pass flow.
INSERT INTO public.member_rsvps (guest_id, invitation_id, attendance, responded_at)
SELECT g.id, g.invitation_id,
  CASE WHEN r.id IS NULL THEN 'pending' WHEN r.attending THEN 'yes' ELSE 'no' END,
  CASE WHEN r.id IS NULL THEN NULL ELSE r.responded_at END
FROM public.guests g LEFT JOIN public.rsvps r ON r.invitation_id = g.invitation_id
ON CONFLICT (guest_id) DO NOTHING;
--> statement-breakpoint
-- Do not infer family relationships or ages from names/contact details.
UPDATE public.invitations i SET kind = 'group'
WHERE kind = 'individual' AND (SELECT count(*) FROM public.guests g WHERE g.invitation_id=i.id) > 1;
--> statement-breakpoint
-- The owner's 2026-11-02 mandate supersedes the historical 90-day default.
UPDATE public.event_settings SET retention_days=365 WHERE retention_days=90;
