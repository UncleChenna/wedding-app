CREATE TABLE "legacy_migration_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_table" text NOT NULL,
	"source_id" uuid NOT NULL,
	"record" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "legacy_migration_records_table" CHECK ("legacy_migration_records"."source_table" in ('invitations', 'guests', 'rsvps', 'check_ins')),
	CONSTRAINT "legacy_migration_records_object" CHECK (jsonb_typeof("legacy_migration_records"."record") = 'object')
);
--> statement-breakpoint
ALTER TABLE "legacy_migration_records" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "member_rsvps" (
	"guest_id" uuid PRIMARY KEY NOT NULL,
	"invitation_id" uuid NOT NULL,
	"attendance" text DEFAULT 'pending' NOT NULL,
	"responded_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "member_rsvps_attendance" CHECK ("member_rsvps"."attendance" in ('pending', 'yes', 'no')),
	CONSTRAINT "member_rsvps_response_time" CHECK (("member_rsvps"."attendance" = 'pending' and "member_rsvps"."responded_at" is null) or ("member_rsvps"."attendance" <> 'pending' and "member_rsvps"."responded_at" is not null))
);
--> statement-breakpoint
ALTER TABLE "member_rsvps" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "rsvp_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invitation_id" uuid NOT NULL,
	"request_id" uuid NOT NULL,
	"fingerprint" text NOT NULL,
	"revision" integer NOT NULL,
	"count_attending" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rsvp_receipts_hash" CHECK ("rsvp_receipts"."fingerprint" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "rsvp_receipts_counts" CHECK ("rsvp_receipts"."revision" >= 0 and "rsvp_receipts"."count_attending" >= 0)
);
--> statement-breakpoint
ALTER TABLE "rsvp_receipts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "event_settings" ALTER COLUMN "retention_days" SET DEFAULT 365;--> statement-breakpoint
ALTER TABLE "guests" ADD COLUMN "age_band" text DEFAULT 'unspecified' NOT NULL;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "rsvp_revision" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "rsvp_reopen_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "kind" text DEFAULT 'individual' NOT NULL;--> statement-breakpoint
-- The referenced composite key must exist before PostgreSQL accepts the foreign key.
CREATE UNIQUE INDEX "guests_invitation_member_key" ON "guests" USING btree ("invitation_id","id");--> statement-breakpoint
ALTER TABLE "member_rsvps" ADD CONSTRAINT "member_rsvps_invitation_id_guest_id_guests_invitation_id_id_fk" FOREIGN KEY ("invitation_id","guest_id") REFERENCES "public"."guests"("invitation_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rsvp_receipts" ADD CONSTRAINT "rsvp_receipts_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "legacy_migration_records_source_key" ON "legacy_migration_records" USING btree ("source_table","source_id");--> statement-breakpoint
CREATE INDEX "member_rsvps_invitation_idx" ON "member_rsvps" USING btree ("invitation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rsvp_receipts_scope_key" ON "rsvp_receipts" USING btree ("invitation_id","request_id");--> statement-breakpoint
ALTER TABLE "guests" ADD CONSTRAINT "guests_age_band" CHECK ("guests"."age_band" in ('unspecified', 'adult', 'child'));--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_rsvp_revision" CHECK ("invitations"."rsvp_revision" >= 0);--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_kind" CHECK ("invitations"."kind" in ('individual', 'family', 'group'));