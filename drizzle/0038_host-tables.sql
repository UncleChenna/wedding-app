ALTER TYPE "public"."staff_role" ADD VALUE 'host';--> statement-breakpoint
CREATE TABLE "host_tables" (
	"staff_id" uuid NOT NULL,
	"table_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "host_tables_staff_id_table_id_pk" PRIMARY KEY("staff_id","table_id")
);
--> statement-breakpoint
ALTER TABLE "host_tables" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "registered_devices" DROP CONSTRAINT "registered_devices_staff_role";--> statement-breakpoint
ALTER TABLE "host_tables" ADD CONSTRAINT "host_tables_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "host_tables" ADD CONSTRAINT "host_tables_table_id_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "host_tables_table_idx" ON "host_tables" USING btree ("table_id");--> statement-breakpoint
ALTER TABLE "registered_devices" ADD CONSTRAINT "registered_devices_staff_role" CHECK ("registered_devices"."role" <> 'admin');