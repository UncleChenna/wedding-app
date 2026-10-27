CREATE TABLE "event_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"couple_names" text[] DEFAULT '{"Uchenna","Adaora"}' NOT NULL,
	"event_date" date DEFAULT '2026-12-19' NOT NULL,
	"ceremony_time" time,
	"time_zone" text,
	"venue" text,
	"map_url" text,
	"dress_code" text,
	"rsvp_lock_at" timestamp with time zone,
	"ordering_open" boolean DEFAULT false NOT NULL,
	"active_theme_id" text DEFAULT 'ivory-gold' NOT NULL,
	"default_max_tag_alongs" integer DEFAULT 1 NOT NULL,
	"retention_days" integer DEFAULT 90 NOT NULL,
	"max_open_orders_per_table" integer DEFAULT 3 NOT NULL,
	"order_cooldown_seconds" integer DEFAULT 30 NOT NULL,
	"max_item_quantity" integer DEFAULT 10 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_settings_singleton" CHECK ("event_settings"."id" = 1),
	CONSTRAINT "event_settings_couple_names" CHECK (cardinality("event_settings"."couple_names") = 2 and array_position("event_settings"."couple_names", null) is null and array_ndims("event_settings"."couple_names") = 1 and length(trim("event_settings"."couple_names"[1])) between 1 and 200 and length(trim("event_settings"."couple_names"[2])) between 1 and 200),
	CONSTRAINT "event_settings_tag_alongs" CHECK ("event_settings"."default_max_tag_alongs" between 0 and 10),
	CONSTRAINT "event_settings_retention" CHECK ("event_settings"."retention_days" between 1 and 3650),
	CONSTRAINT "event_settings_order_limits" CHECK ("event_settings"."max_open_orders_per_table" between 1 and 100 and "event_settings"."order_cooldown_seconds" between 0 and 86400 and "event_settings"."max_item_quantity" between 1 and 100),
	CONSTRAINT "event_settings_cutoff_timezone" CHECK ("event_settings"."rsvp_lock_at" is null or "event_settings"."time_zone" is not null),
	CONSTRAINT "event_settings_timezone_not_blank" CHECK ("event_settings"."time_zone" is null or length(trim("event_settings"."time_zone")) > 0),
	CONSTRAINT "event_settings_theme_not_blank" CHECK (length(trim("event_settings"."active_theme_id")) between 1 and 100),
	CONSTRAINT "event_settings_map_https" CHECK ("event_settings"."map_url" is null or "event_settings"."map_url" like 'https://%')
);
--> statement-breakpoint
ALTER TABLE "event_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "rsvp_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invitation_id" uuid NOT NULL,
	"before" jsonb,
	"after" jsonb NOT NULL,
	"actor" text NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rsvp_changes_before_object" CHECK ("rsvp_changes"."before" is null or jsonb_typeof("rsvp_changes"."before") = 'object'),
	CONSTRAINT "rsvp_changes_after_object" CHECK (jsonb_typeof("rsvp_changes"."after") = 'object'),
	CONSTRAINT "rsvp_changes_actor_not_blank" CHECK (length(trim("rsvp_changes"."actor")) between 1 and 200)
);
--> statement-breakpoint
ALTER TABLE "rsvp_changes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "rsvp_changes" ADD CONSTRAINT "rsvp_changes_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rsvp_changes_invitation_changed_idx" ON "rsvp_changes" USING btree ("invitation_id","changed_at");