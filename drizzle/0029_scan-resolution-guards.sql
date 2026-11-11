-- Resolution notes are additive evidence, never a rewrite of a scan or admission.
CREATE TRIGGER scan_resolution_notes_append_only
BEFORE UPDATE OR DELETE OR TRUNCATE ON "public"."scan_resolution_notes"
FOR EACH STATEMENT EXECUTE FUNCTION "public"."reject_admission_evidence_mutation"();
