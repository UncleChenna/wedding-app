CREATE TABLE "station_order_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"station_order_id" uuid NOT NULL,
	"from_status" "station_order_status" NOT NULL,
	"to_status" "station_order_status" NOT NULL,
	"reason" text,
	"staff_id" uuid,
	"device_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "station_order_events_cancel_reason" CHECK ("station_order_events"."to_status" <> 'cancelled' or length(trim(coalesce("station_order_events"."reason", ''))) > 0),
	CONSTRAINT "station_order_events_moves" CHECK ("station_order_events"."from_status" <> "station_order_events"."to_status")
);
--> statement-breakpoint
ALTER TABLE "station_order_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "station_order_events" ADD CONSTRAINT "station_order_events_station_order_id_station_orders_id_fk" FOREIGN KEY ("station_order_id") REFERENCES "public"."station_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "station_order_events" ADD CONSTRAINT "station_order_events_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "station_order_events" ADD CONSTRAINT "station_order_events_device_id_registered_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."registered_devices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "station_order_events_order_idx" ON "station_order_events" USING btree ("station_order_id","created_at");