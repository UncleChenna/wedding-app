CREATE TABLE "scan_resolution_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"request_id" uuid NOT NULL,
	"admin_id" uuid NOT NULL,
	"resolution" text NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scan_resolution_notes_request_id_unique" UNIQUE("request_id"),
	CONSTRAINT "scan_resolution_notes_resolution" CHECK ("scan_resolution_notes"."resolution" in ('reviewed', 'escalated', 'explained', 'follow_up'))
);
--> statement-breakpoint
ALTER TABLE "scan_resolution_notes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "scan_resolution_notes" ADD CONSTRAINT "scan_resolution_notes_event_id_scan_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."scan_events"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "scan_resolution_notes_event_time_idx" ON "scan_resolution_notes" USING btree ("event_id","recorded_at");