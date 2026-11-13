CREATE TABLE "staff_push_subscriptions" (
	"device_id" text PRIMARY KEY NOT NULL,
	"staff_id" uuid NOT NULL,
	"station" "station" NOT NULL,
	"credential_version" integer NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_push_endpoint_length" CHECK (char_length("staff_push_subscriptions"."endpoint") between 1 and 2048),
	CONSTRAINT "staff_push_key_format" CHECK ("staff_push_subscriptions"."p256dh" ~ '^B[A-Za-z0-9_-]{86}$' and "staff_push_subscriptions"."auth" ~ '^[A-Za-z0-9_-]{22}$'),
	CONSTRAINT "staff_push_credential_version" CHECK ("staff_push_subscriptions"."credential_version" > 0)
);
--> statement-breakpoint
ALTER TABLE "staff_push_subscriptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "order_alerts" ADD COLUMN "push_status" "order_alert_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "order_alerts" ADD COLUMN "push_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "staff_push_subscriptions" ADD CONSTRAINT "staff_push_subscriptions_device_id_registered_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."registered_devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_push_subscriptions" ADD CONSTRAINT "staff_push_subscriptions_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "staff_push_endpoint_key" ON "staff_push_subscriptions" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "order_alerts_push_pending_idx" ON "order_alerts" USING btree ("push_status","station","created_at");--> statement-breakpoint
ALTER TABLE "order_alerts" ADD CONSTRAINT "order_alerts_push_attempts" CHECK ("order_alerts"."push_attempts" between 0 and 5);