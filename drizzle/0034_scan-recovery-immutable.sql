-- Keep recovery review evidence immutable like the underlying scan history.
CREATE TRIGGER scan_recovery_audits_append_only BEFORE UPDATE OR DELETE OR TRUNCATE
ON "public"."scan_recovery_audits" FOR EACH STATEMENT
EXECUTE FUNCTION "public"."reject_admission_evidence_mutation"();
