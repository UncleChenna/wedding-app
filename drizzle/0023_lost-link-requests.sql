CREATE TABLE "invitation_link_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"contact" text NOT NULL,
	"contact_kind" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invitation_link_requests_name" CHECK (length(trim("invitation_link_requests"."name")) between 1 and 200),
	CONSTRAINT "invitation_link_requests_contact" CHECK (length(trim("invitation_link_requests"."contact")) between 1 and 254),
	CONSTRAINT "invitation_link_requests_kind" CHECK ("invitation_link_requests"."contact_kind" in ('email', 'phone'))
);
--> statement-breakpoint
ALTER TABLE "invitation_link_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "request_budgets" DROP CONSTRAINT "request_budgets_scope";--> statement-breakpoint
CREATE INDEX "invitation_link_requests_created_idx" ON "invitation_link_requests" USING btree ("created_at","id");--> statement-breakpoint
ALTER TABLE "request_budgets" ADD CONSTRAINT "request_budgets_scope" CHECK ("request_budgets"."scope" in ('lookup', 'pin', 'lost_link'));