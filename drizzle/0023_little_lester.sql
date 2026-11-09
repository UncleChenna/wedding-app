ALTER TABLE "staff" ADD COLUMN "whatsapp_number" text;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "alerts_opt_in" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_whatsapp_number_e164" CHECK ("staff"."whatsapp_number" is null or "staff"."whatsapp_number" ~ '^[+][1-9][0-9]{7,14}$');--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_alerts_need_number" CHECK (not "staff"."alerts_opt_in" or ("staff"."whatsapp_number" is not null and "staff"."role" in ('kitchen', 'bar')));