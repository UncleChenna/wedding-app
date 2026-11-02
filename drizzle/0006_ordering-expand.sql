CREATE TYPE "public"."menu_category_v2" AS ENUM('meal', 'soft_drink', 'alcohol');--> statement-breakpoint
CREATE TYPE "public"."station_order_status" AS ENUM('received', 'preparing', 'served', 'cancelled');--> statement-breakpoint
CREATE TABLE "station_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"station" "station" NOT NULL,
	"status" "station_order_status" DEFAULT 'received' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "station_orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "menu_items" ALTER COLUMN "category" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "category_v2" "menu_category_v2";--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "max_per_order" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "station_order_id" uuid;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "quantity_limit" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "client_request_id" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "station_orders" ADD CONSTRAINT "station_orders_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "station_orders_order_station_key" ON "station_orders" USING btree ("order_id","station");--> statement-breakpoint
CREATE UNIQUE INDEX "station_orders_order_id_id_key" ON "station_orders" USING btree ("order_id","id");--> statement-breakpoint
CREATE INDEX "station_orders_queue_idx" ON "station_orders" USING btree ("station","status","created_at");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_client_request_id_unique" UNIQUE("client_request_id");--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_quantity_cap" CHECK ("menu_items"."max_per_order" between 1 and 100);