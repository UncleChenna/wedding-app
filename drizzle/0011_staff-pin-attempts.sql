CREATE TABLE "staff_pin_attempts" (
	"device_id" text PRIMARY KEY NOT NULL,
	"failures" integer DEFAULT 0 NOT NULL,
	"window_started_at" timestamp with time zone NOT NULL,
	CONSTRAINT "staff_pin_attempts_device_format" CHECK ("staff_pin_attempts"."device_id" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "staff_pin_attempts_failures_range" CHECK ("staff_pin_attempts"."failures" between 0 and 5)
);
--> statement-breakpoint
ALTER TABLE "staff_pin_attempts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "staff_pin_attempts_window_idx" ON "staff_pin_attempts" USING btree ("window_started_at");