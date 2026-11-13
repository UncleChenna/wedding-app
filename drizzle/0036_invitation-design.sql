CREATE TABLE "invitation_design" (
	"id" integer PRIMARY KEY NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"photo_id" uuid,
	"photo_alt" text DEFAULT '' NOT NULL,
	"headline" text NOT NULL,
	"subline" text NOT NULL,
	"updated_by" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invitation_design_singleton" CHECK ("invitation_design"."id" = 1),
	CONSTRAINT "invitation_design_version" CHECK ("invitation_design"."version" > 0),
	CONSTRAINT "invitation_design_headline" CHECK (length(trim("invitation_design"."headline")) between 1 and 200),
	CONSTRAINT "invitation_design_subline" CHECK (length(trim("invitation_design"."subline")) between 1 and 1000),
	CONSTRAINT "invitation_design_alt" CHECK (length("invitation_design"."photo_alt") <= 500 and ("invitation_design"."photo_id" is null or length(trim("invitation_design"."photo_alt")) > 0))
);
--> statement-breakpoint
ALTER TABLE "invitation_design" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "invitation_design" ADD CONSTRAINT "invitation_design_photo_id_invitation_photos_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."invitation_photos"("id") ON DELETE restrict ON UPDATE no action;