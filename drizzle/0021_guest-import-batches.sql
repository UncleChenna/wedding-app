CREATE TABLE "guest_import_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"digest" text NOT NULL,
	"actor_id" uuid NOT NULL,
	"csv" text,
	"table_snapshot" jsonb NOT NULL,
	"invitation_ids" jsonb,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guest_import_batches_digest_unique" UNIQUE("digest"),
	CONSTRAINT "guest_import_digest" CHECK ("guest_import_batches"."digest" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "guest_import_csv_bound" CHECK ("guest_import_batches"."csv" is null or octet_length("guest_import_batches"."csv") <= 262144)
);
--> statement-breakpoint
ALTER TABLE "guest_import_batches" ENABLE ROW LEVEL SECURITY;