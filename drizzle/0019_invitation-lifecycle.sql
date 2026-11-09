CREATE TABLE "invitation_lifecycle_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invitation_id" uuid NOT NULL,
	"operation" text NOT NULL,
	"actor_id" uuid NOT NULL,
	"before_status" "invitation_status" NOT NULL,
	"after_status" "invitation_status" NOT NULL,
	"before_version" integer NOT NULL,
	"after_version" integer NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invitation_lifecycle_operation" CHECK ("invitation_lifecycle_events"."operation" in ('revoke', 'reissue')),
	CONSTRAINT "invitation_lifecycle_versions_positive" CHECK ("invitation_lifecycle_events"."before_version" > 0 and "invitation_lifecycle_events"."after_version" > 0),
	CONSTRAINT "invitation_lifecycle_transition" CHECK (("invitation_lifecycle_events"."operation" = 'revoke' and "invitation_lifecycle_events"."after_status" = 'revoked' and "invitation_lifecycle_events"."after_version" = "invitation_lifecycle_events"."before_version") or ("invitation_lifecycle_events"."operation" = 'reissue' and "invitation_lifecycle_events"."after_status" in ('sent', 'rsvp_yes', 'rsvp_no') and "invitation_lifecycle_events"."after_version"::bigint = "invitation_lifecycle_events"."before_version"::bigint + 1))
);
--> statement-breakpoint
ALTER TABLE "invitation_lifecycle_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "invitation_lifecycle_events" ADD CONSTRAINT "invitation_lifecycle_events_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invitation_lifecycle_invitation_time_idx" ON "invitation_lifecycle_events" USING btree ("invitation_id","occurred_at");