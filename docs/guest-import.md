# Guest CSV import contract

TICKET-182 supplies the backend; TICKET-091 supplies upload, preview and explicit confirmation UI.

## File format

Accept UTF-8 CSV, at most **256 KiB (262144 bytes)** and **300 named guest records**. Headers are case-insensitive and may be reordered: `name,phone,email,party size,side,table`. All six headers are required; values for contact, side and table may be empty. Optional `household` groups multiple named members. Unknown or duplicate headers, uneven columns and malformed quoting are rejected. Commas, escaped quotes and newlines within quoted fields are supported. A UTF-8 BOM and CRLF/LF records are supported. Error row numbers count logical CSV records, including the header as row 1, rather than physical lines inside quoted fields.

Each ungrouped row creates one household named after the guest. Explicit household names group case-insensitively. Group members must agree on party size, side and table. `party size` is the maximum invited total: named members plus 0–10 unnamed tag-along places. It is **not an RSVP**. All named imported members are primary invitees; every new invitation is a draft with a fresh secure token. Tables must already exist; imports do not create tables. Table capacity does not prohibit an invitation assignment.

Within a household, duplicate names are rejected; contacts can be shared by its members. A contact shared across different households is rejected for correction, never silently merged. Existing household names (case-insensitive) or contact matches reject the new import; edit the existing invitation instead. Distinct households with intentionally identical names need distinct household labels. Existing invitations, members, replies, meals and admission records are never overwritten. This is a create-only import, not an upsert.

## Public action contract

Types: `src/modules/admin/lib/guest-import.ts`.

- `previewGuestImportAction(csv: string)` from `server/guest-import-actions.ts`: `{status:"preview",preview:{id,digest,expiresAt,households,counts:{invitations,guests}}}` or `{status:"error",message,errors:[{row,column,message}]}`.
- Each household has `{householdName,side,tableNumber,maxTagAlongs,rows,members:[{name,email,phone}]}`. Nullable fields use `null`. Display maximum party size as `members.length + maxTagAlongs`.
- `commitGuestImportAction({previewId,digest})`: `{status:"committed",invitationIds,count,replayed}` or `{status:"error",message}`. Never submit edited preview rows; edit the file and request a new preview.
- `guestImportErrorsCsv(errors)` exports errors using the same spreadsheet-formula protection as the guest-list export. Formula-looking names remain literal data in storage and are neutralized only when exported.

Both actions require current allowlisted, two-factor admin access. The actor comes from authenticated access, not the request. Raw capability tokens never appear in returned previews or receipts. Rendering alone is not authorization.

## Approval, concurrency and retention

Previews are private RLS-enabled database rows with no public policies. They expire after 30 minutes. A replacement uncommitted preview rotates its opaque ID, invalidating old approvals. The digest covers normalized household content, ignoring source row positions and household ordering. Committed digests remain unique: a repeated file, including through a new preview, returns the original receipt instead of inserting again. A different administrator is told the batch was already imported, without returning its receipt. Modified overlapping files are rejected by existing name/contact checks.

Commit validates ID, digest, actor, expiry and stored normalized contents; it rechecks contacts, household names and referenced table identity/number/name/capacity. Changed inputs fail closed. A transaction-scoped advisory lock serializes import operations, and short SHARE ROW EXCLUSIVE locks on invitations, guests and tables prevent other writers racing the conflict checks. Up to 300 guest rows are inserted in one transaction. Any insert failure rolls back all writes and leaves the preview retryable. Database locks can briefly delay other edits; no external services run inside the transaction.

On success the raw CSV and table snapshot are cleared immediately; only IDs, digest and actor/time metadata remain for durable idempotency. Expired uncommitted payloads are cleared opportunistically on the next preview request, not by a timer. The general retention job must include abandoned previews when that job ships; expiry is an authorization bound, not a promise of immediate disk erasure. Local synthetic seeding also clears receipts so fixture resets cannot leave stale references. Production deletion of receipts would remove durable replay protection and is not part of normal import.

## Migration and rollout

Apply generated `0021_guest-import-batches.sql` before exposing the UI. It adds one RLS-enabled table and preserves existing data/policies. Roll back application code first; retaining the private table and committed receipts is safe. Do not drop receipts merely to retry an import.
