CREATE TABLE "request_budgets" (
	"scope" text NOT NULL,
	"identity" text NOT NULL,
	"used" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "request_budgets_scope_identity_pk" PRIMARY KEY("scope","identity"),
	CONSTRAINT "request_budgets_scope" CHECK ("request_budgets"."scope" in ('lookup', 'pin')),
	CONSTRAINT "request_budgets_identity" CHECK ("request_budgets"."identity" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "request_budgets_used" CHECK ("request_budgets"."used" between 0 and 100000)
);
--> statement-breakpoint
ALTER TABLE "request_budgets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "request_budgets_expiry_idx" ON "request_budgets" USING btree ("expires_at");