CREATE TABLE "invitation_photos" (
	"slot" integer PRIMARY KEY NOT NULL,
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"bytes" "bytea" NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"blur_data_url" text NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invitation_photos_id_unique" UNIQUE("id"),
	CONSTRAINT "invitation_photos_slot" CHECK ("invitation_photos"."slot" between 1 and 16),
	CONSTRAINT "invitation_photos_size" CHECK (octet_length("invitation_photos"."bytes") between 1 and 4194304),
	CONSTRAINT "invitation_photos_dimensions" CHECK ("invitation_photos"."width" between 1 and 2560 and "invitation_photos"."height" between 1 and 2560),
	CONSTRAINT "invitation_photos_blur" CHECK (length("invitation_photos"."blur_data_url") between 24 and 10947 and left("invitation_photos"."blur_data_url", 23) = 'data:image/webp' || chr(59) || 'base64,')
);
--> statement-breakpoint
ALTER TABLE "invitation_photos" ENABLE ROW LEVEL SECURITY;