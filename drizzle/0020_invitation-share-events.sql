CREATE TABLE "invitation_share_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"sequence" integer GENERATED ALWAYS AS IDENTITY (sequence name "invitation_share_events_sequence_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"invitation_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"channel" text NOT NULL,
	"token_version" integer NOT NULL,
	"previous_status" "invitation_status" NOT NULL,
	"previous_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"undone_at" timestamp with time zone,
	CONSTRAINT "invitation_share_events_channel" CHECK ("invitation_share_events"."channel" in ('whatsapp', 'email', 'copy', 'native')),
	CONSTRAINT "invitation_share_events_version" CHECK ("invitation_share_events"."token_version" > 0),
	CONSTRAINT "invitation_share_events_undo_time" CHECK ("invitation_share_events"."undone_at" is null or "invitation_share_events"."undone_at" >= "invitation_share_events"."created_at")
);
--> statement-breakpoint
ALTER TABLE "invitation_share_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "invitation_share_events" ADD CONSTRAINT "invitation_share_events_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invitation_share_events_invitation_idx" ON "invitation_share_events" USING btree ("invitation_id","created_at");