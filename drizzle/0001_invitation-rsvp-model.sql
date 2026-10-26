CREATE TYPE "public"."invitation_status" AS ENUM('draft', 'sent', 'rsvp_yes', 'rsvp_no', 'revoked');--> statement-breakpoint
ALTER TABLE "guests" RENAME COLUMN "dietary_requirements" TO "dietary_notes";--> statement-breakpoint
ALTER TABLE "invitations" RENAME COLUMN "code" TO "token";--> statement-breakpoint
ALTER TABLE "guests" DROP CONSTRAINT "guests_qr_token_unique";--> statement-breakpoint
ALTER TABLE "invitations" DROP CONSTRAINT "invitations_code_unique";--> statement-breakpoint
ALTER TABLE "invitations" DROP CONSTRAINT "invitations_max_guests_positive";--> statement-breakpoint
ALTER TABLE "invitations" ALTER COLUMN "household_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "rsvps" ALTER COLUMN "responded_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "rsvps" ALTER COLUMN "responded_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "guests" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "guests" ADD COLUMN "meal_choice" text;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "max_tag_alongs" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "status" "invitation_status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "token_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "table_id" uuid;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "side" text;--> statement-breakpoint
ALTER TABLE "rsvps" ADD COLUMN "attending" boolean NOT NULL;--> statement-breakpoint
ALTER TABLE "rsvps" ADD COLUMN "count_attending" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_table_id_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invitations_table_id_idx" ON "invitations" USING btree ("table_id");--> statement-breakpoint
ALTER TABLE "guests" DROP COLUMN "first_name";--> statement-breakpoint
ALTER TABLE "guests" DROP COLUMN "last_name";--> statement-breakpoint
ALTER TABLE "guests" DROP COLUMN "is_tag_along";--> statement-breakpoint
ALTER TABLE "guests" DROP COLUMN "qr_token";--> statement-breakpoint
ALTER TABLE "invitations" DROP COLUMN "max_guests";--> statement-breakpoint
ALTER TABLE "rsvps" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_token_unique" UNIQUE("token");--> statement-breakpoint
ALTER TABLE "guests" ADD CONSTRAINT "guests_name_not_blank" CHECK (length(trim("guests"."name")) > 0);--> statement-breakpoint
ALTER TABLE "guests" ADD CONSTRAINT "guests_phone_e164" CHECK ("guests"."phone" is null or "guests"."phone" ~ '^\+[1-9][0-9]{1,14}$');--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_tag_along_capacity" CHECK ("invitations"."max_tag_alongs" between 0 and 10);--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_token_format" CHECK ("invitations"."token" ~ '^[A-Za-z0-9_-]{22,}$');--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_token_version_positive" CHECK ("invitations"."token_version" > 0);--> statement-breakpoint
ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_attendance_count" CHECK (("rsvps"."attending" and "rsvps"."count_attending" > 0) or (not "rsvps"."attending" and "rsvps"."count_attending" = 0));--> statement-breakpoint
DROP TYPE "public"."rsvp_status";