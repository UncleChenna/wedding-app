ALTER TABLE "staff" DROP CONSTRAINT "staff_pin_credential_complete";--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_pin_credential_complete" CHECK (
      ("staff"."pin_hash" is null and "staff"."pin_issued_at" is null and "staff"."pin_expires_at" is null)
      or
      ("staff"."pin_hash" is not null and "staff"."pin_issued_at" is not null and "staff"."pin_expires_at" is not null
       and "staff"."pin_expires_at" > "staff"."pin_issued_at" and "staff"."role" <> 'admin'
       and "staff"."pin_hash" ~ '^scrypt[$][1-9][0-9]{0,6}[$][1-9][0-9]{0,3}[$][1-9][0-9]{0,3}[$][0-9a-f]{32,128}[$]([0-9a-f]{2}){32,128}$')
    );