CREATE TYPE "public"."order_alert_status" AS ENUM('pending', 'sent', 'failed');--> statement-breakpoint
CREATE TABLE "order_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"station_order_id" uuid NOT NULL,
	"station" "station" NOT NULL,
	"message" text NOT NULL,
	"status" "order_alert_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_alerts_attempts" CHECK ("order_alerts"."attempts" between 0 and 100),
	CONSTRAINT "order_alerts_message" CHECK (char_length("order_alerts"."message") between 1 and 4000)
);
--> statement-breakpoint
ALTER TABLE "order_alerts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "order_alerts" ADD CONSTRAINT "order_alerts_station_order_id_station_orders_id_fk" FOREIGN KEY ("station_order_id") REFERENCES "public"."station_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "order_alerts_station_order_key" ON "order_alerts" USING btree ("station_order_id");--> statement-breakpoint
CREATE INDEX "order_alerts_pending_idx" ON "order_alerts" USING btree ("status","station","created_at");