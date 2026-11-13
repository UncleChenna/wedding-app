CREATE TABLE "scan_recovery_audits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"client_event_id" uuid NOT NULL,
	"admin_id" uuid NOT NULL,
	"intent_digest" text NOT NULL,
	"outcome" text NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scan_recovery_audits_digest" CHECK ("scan_recovery_audits"."intent_digest" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "scan_recovery_audits_outcome" CHECK ("scan_recovery_audits"."outcome" in ('recorded', 'duplicate', 'rejected'))
);
--> statement-breakpoint
ALTER TABLE "scan_recovery_audits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE UNIQUE INDEX "scan_recovery_audits_request_event_idx" ON "scan_recovery_audits" USING btree ("admin_id","request_id","client_event_id");--> statement-breakpoint
CREATE INDEX "scan_recovery_audits_event_time_idx" ON "scan_recovery_audits" USING btree ("client_event_id","recorded_at");