CREATE TABLE "registered_devices" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"name" text NOT NULL,
	"role" "staff_role" NOT NULL,
	"registered_by_staff_id" uuid,
	"registered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "registered_devices_id_format" CHECK ("registered_devices"."id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$'),
	CONSTRAINT "registered_devices_name_length" CHECK (char_length(trim("registered_devices"."name")) between 1 and 120),
	CONSTRAINT "registered_devices_staff_role" CHECK ("registered_devices"."role" in ('gate', 'kitchen', 'bar'))
);
--> statement-breakpoint
ALTER TABLE "registered_devices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "staff" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "pin_hash" text;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "pin_issued_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "pin_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "credential_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "revoked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "registered_devices" ADD CONSTRAINT "registered_devices_registered_by_staff_id_staff_id_fk" FOREIGN KEY ("registered_by_staff_id") REFERENCES "public"."staff"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_credential_version_positive" CHECK ("staff"."credential_version" > 0);--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_pin_credential_complete" CHECK (
      ("staff"."pin_hash" is null and "staff"."pin_issued_at" is null and "staff"."pin_expires_at" is null)
      or
      ("staff"."pin_hash" is not null and "staff"."pin_issued_at" is not null and "staff"."pin_expires_at" is not null
       and "staff"."pin_expires_at" > "staff"."pin_issued_at" and "staff"."role" <> 'admin'
       and "staff"."pin_hash" ~ '^scrypt[$][1-9][0-9]{0,6}[$][1-9][0-9]{0,3}[$][1-9][0-9]{0,3}[$][0-9a-f]{32,128}[$][0-9a-f]{64,256}$')
    );