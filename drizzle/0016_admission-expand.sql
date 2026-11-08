CREATE TYPE "public"."scan_result" AS ENUM('valid', 'already_used', 'invalid', 'revoked', 'not_rsvped');--> statement-breakpoint
CREATE TABLE "admission_counters" (
	"invitation_id" uuid PRIMARY KEY NOT NULL,
	"allowance" integer NOT NULL,
	"admitted_people" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admission_counters_allowance_nonnegative" CHECK ("admission_counters"."allowance" >= 0),
	CONSTRAINT "admission_counters_bounded" CHECK ("admission_counters"."admitted_people" >= 0 and "admission_counters"."admitted_people" <= "admission_counters"."allowance")
);
--> statement-breakpoint
ALTER TABLE "admission_counters" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "scan_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_event_id" uuid NOT NULL,
	"invitation_id" uuid,
	"staff_id" uuid,
	"device_id" text,
	"reported_at" timestamp with time zone NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reported_result" "scan_result" NOT NULL,
	"result" "scan_result" NOT NULL,
	"reported_people" integer NOT NULL,
	"admitted_people" integer NOT NULL,
	"conflict" boolean DEFAULT false NOT NULL,
	"source" text NOT NULL,
	"legacy_check_in_id" uuid,
	CONSTRAINT "scan_events_source" CHECK ("scan_events"."source" in ('online', 'offline', 'legacy')),
	CONSTRAINT "scan_events_counts" CHECK ("scan_events"."reported_people" >= 0 and "scan_events"."admitted_people" >= 0 and "scan_events"."admitted_people" <= "scan_events"."reported_people"),
	CONSTRAINT "scan_events_canonical_admission" CHECK ("scan_events"."admitted_people" = 0 or ("scan_events"."result" = 'valid' and "scan_events"."invitation_id" is not null)),
	CONSTRAINT "scan_events_reported_admission" CHECK ("scan_events"."reported_people" = 0 or "scan_events"."reported_result" = 'valid'),
	CONSTRAINT "scan_events_unallocated_report_conflict" CHECK ("scan_events"."reported_people" = "scan_events"."admitted_people" or "scan_events"."conflict"),
	CONSTRAINT "scan_events_live_identity" CHECK ("scan_events"."source" = 'legacy' or ("scan_events"."staff_id" is not null and "scan_events"."device_id" is not null)),
	CONSTRAINT "scan_events_legacy_identity" CHECK (("scan_events"."source" = 'legacy') = ("scan_events"."legacy_check_in_id" is not null))
);
--> statement-breakpoint
ALTER TABLE "scan_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "admission_counters" ADD CONSTRAINT "admission_counters_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_events" ADD CONSTRAINT "scan_events_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_events" ADD CONSTRAINT "scan_events_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_events" ADD CONSTRAINT "scan_events_device_id_registered_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."registered_devices"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_events" ADD CONSTRAINT "scan_events_legacy_check_in_id_check_ins_id_fk" FOREIGN KEY ("legacy_check_in_id") REFERENCES "public"."check_ins"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "scan_events_client_event_id_key" ON "scan_events" USING btree ("client_event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "scan_events_legacy_check_in_id_key" ON "scan_events" USING btree ("legacy_check_in_id");--> statement-breakpoint
CREATE INDEX "scan_events_invitation_received_idx" ON "scan_events" USING btree ("invitation_id","received_at");--> statement-breakpoint
CREATE INDEX "scan_events_device_received_idx" ON "scan_events" USING btree ("device_id","received_at");--> statement-breakpoint
CREATE INDEX "scan_events_staff_received_idx" ON "scan_events" USING btree ("staff_id","received_at");