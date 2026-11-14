ALTER TABLE "event_settings" ALTER COLUMN "ceremony_time" SET DEFAULT '12:00';--> statement-breakpoint
ALTER TABLE "event_settings" ALTER COLUMN "time_zone" SET DEFAULT 'Africa/Lagos';--> statement-breakpoint
ALTER TABLE "event_settings" ALTER COLUMN "venue" SET DEFAULT 'St Paul''s Anglican Church, Apo Resettlement, Abuja';--> statement-breakpoint
ALTER TABLE "event_settings" ALTER COLUMN "rsvp_lock_at" SET DEFAULT '2026-12-17 23:59:00+01';--> statement-breakpoint
ALTER TABLE "event_settings" ADD COLUMN "reception_time" time DEFAULT '14:30';--> statement-breakpoint
ALTER TABLE "event_settings" ADD COLUMN "reception_venue" text DEFAULT 'Fineworld Recreational Park, Events & Gardens, opposite AYM Shafa fuel station, Apo Resettlement, Abuja';--> statement-breakpoint
ALTER TABLE "event_settings" ADD COLUMN "reception_map_url" text;--> statement-breakpoint
ALTER TABLE "event_settings" ADD COLUMN "rsvp_phone" text DEFAULT '09160665114';