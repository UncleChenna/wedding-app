CREATE TYPE "public"."menu_category" AS ENUM('food', 'drink');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('received', 'preparing', 'ready', 'served', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."rsvp_status" AS ENUM('pending', 'attending', 'declined');--> statement-breakpoint
CREATE TYPE "public"."staff_role" AS ENUM('admin', 'gate', 'kitchen', 'bar');--> statement-breakpoint
CREATE TYPE "public"."station" AS ENUM('kitchen', 'bar');--> statement-breakpoint
CREATE TABLE "check_ins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guest_id" uuid NOT NULL,
	"staff_id" uuid,
	"checked_in_at" timestamp with time zone NOT NULL,
	"device_id" text,
	"client_event_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "check_ins" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "guests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invitation_id" uuid NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text,
	"phone" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_tag_along" boolean DEFAULT false NOT NULL,
	"dietary_requirements" text,
	"table_id" uuid,
	"qr_token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guests_qr_token_unique" UNIQUE("qr_token")
);
--> statement-breakpoint
ALTER TABLE "guests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"household_name" text NOT NULL,
	"max_guests" integer DEFAULT 1 NOT NULL,
	"notes" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invitations_code_unique" UNIQUE("code"),
	CONSTRAINT "invitations_max_guests_positive" CHECK ("invitations"."max_guests" > 0)
);
--> statement-breakpoint
ALTER TABLE "invitations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "menu_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" "menu_category" NOT NULL,
	"station" "station" NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"dietary_tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "menu_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"menu_item_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_items_quantity_positive" CHECK ("order_items"."quantity" > 0)
);
--> statement-breakpoint
ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"table_id" uuid NOT NULL,
	"guest_name" text,
	"status" "order_status" DEFAULT 'received' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "rsvps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invitation_id" uuid NOT NULL,
	"status" "rsvp_status" DEFAULT 'pending' NOT NULL,
	"message" text,
	"responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rsvps_invitation_id_unique" UNIQUE("invitation_id")
);
--> statement-breakpoint
ALTER TABLE "rsvps" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" uuid,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" "staff_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_auth_user_id_unique" UNIQUE("auth_user_id"),
	CONSTRAINT "staff_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "staff" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" integer NOT NULL,
	"name" text,
	"capacity" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tables_number_unique" UNIQUE("number"),
	CONSTRAINT "tables_capacity_positive" CHECK ("tables"."capacity" > 0)
);
--> statement-breakpoint
ALTER TABLE "tables" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "themes" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"tokens" jsonb NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "themes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guests" ADD CONSTRAINT "guests_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guests" ADD CONSTRAINT "guests_table_id_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_table_id_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "check_ins_guest_id_key" ON "check_ins" USING btree ("guest_id");--> statement-breakpoint
CREATE UNIQUE INDEX "check_ins_client_event_id_key" ON "check_ins" USING btree ("client_event_id");--> statement-breakpoint
CREATE INDEX "guests_invitation_id_idx" ON "guests" USING btree ("invitation_id");--> statement-breakpoint
CREATE INDEX "guests_table_id_idx" ON "guests" USING btree ("table_id");--> statement-breakpoint
CREATE INDEX "order_items_order_id_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "orders_status_created_at_idx" ON "orders" USING btree ("status","created_at");