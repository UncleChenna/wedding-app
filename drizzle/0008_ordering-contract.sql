ALTER TABLE "menu_items" ALTER COLUMN "category_v2" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "station_order_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_station_submission_fk" FOREIGN KEY ("order_id","station_order_id") REFERENCES "public"."station_orders"("order_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "order_items_order_menu_key" ON "order_items" USING btree ("order_id","menu_item_id");--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_quantity_cap" CHECK ("order_items"."quantity_limit" between 1 and 100 and "order_items"."quantity" <= "order_items"."quantity_limit");