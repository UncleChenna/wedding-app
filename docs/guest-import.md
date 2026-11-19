# Guest CSV import contract

TICKET-182 supplies the backend; TICKET-091 supplies upload, preview and explicit confirmation UI.

## File format

Accept UTF-8 CSV, at most **256 KiB (262144 bytes)** and **300 named guest records**. Headers are case-insensitive and may be reordered: `name,phone,email,party size,side,table`. All six headers are required; values for contact, side and table may be empty. Use one row per invited guest; additional grouping columns are not accepted. Unknown or duplicate headers, uneven columns and malformed quoting are rejected. Commas, escaped quotes and newlines within quoted fields are supported. A UTF-8 BOM and CRLF/LF records are supported. Error row numbers count logical CSV records, including the header as row 1, rather than physical lines inside quoted fields.

Each row creates one invitation for the named guest. `party size` is the maximum invited total: that guest plus 0–10 plus-one places. It is **not an RSVP**. The guest and their plus-ones share the invitation and table. Add other named members through the guest editor. New invitations are drafts with fresh secure tokens. Tables must already exist; imports do not create tables. Table capacity does not prohibit an invitation assignment.

Duplicate contacts within a file or matching existing guests are rejected for correction, never silently merged. Guests may have identical names; no separate grouping label is required. Existing invitations, guests, replies, meals and admission records are never overwritten. This is a create-only import, not an upsert.

## Public action contract

Types: `src/modules/admin/lib/guest-import.ts`.

- `previewGuestImportAction(csv: string)` from `server/guest-import-actions.ts`: `{status:"preview",preview:{id,digest,expiresAt,parties,counts:{invitations,guests}}}` or `{status:"error",message,errors:[{row,column,message}]}`.
- Each invited party has `{side,tableNumber,maxTagAlongs,rows,members:[{name,email,phone}]}`. Nullable fields use `null`. Display maximum party size as `members.length + maxTagAlongs`.
- `commitGuestImportAction({previewId,digest})`: `{status:"committed",invitationIds,count,replayed}` or `{status:"error",message}`. Never submit edited preview rows; edit the file and request a new preview.
- `guestImportErrorsCsv(errors)` exports errors using the same spreadsheet-formula protection as the guest-list export. Formula-looking names remain literal data in storage and are neutralized only when exported.

Both actions require current allowlisted admin access. The actor comes from authenticated access, not the request. Raw capability tokens never appear in returned previews or receipts. Rendering alone is not authorization.

## Approval, concurrency and retention

Previews are private RLS-enabled database rows with no public policies. They expire after 30 minutes. A replacement uncommitted preview rotates its opaque ID, invalidating old approvals. The digest covers normalized guest content, ignoring source row positions and invitation ordering. Committed digests remain unique: a repeated file, including through a new preview, returns the original receipt instead of inserting again. A different administrator is told the batch was already imported, without returning its receipt. Modified overlapping files are rejected by existing contact checks.

Commit validates ID, digest, actor, expiry and stored normalized contents, then checks expiry again after lock acquisition and conflict reads, immediately before writes; it rechecks contacts and referenced table identity/number/name/capacity. Changed inputs fail closed. A transaction-scoped advisory lock serializes import operations, and short SHARE ROW EXCLUSIVE locks on invitations, guests and tables prevent other writers racing the conflict checks. Up to 300 guest rows are inserted in one transaction. Any insert failure rolls back all writes and leaves the preview retryable. Database locks can briefly delay other edits; no external services run inside the transaction.

On success the raw CSV and table snapshot are cleared immediately; only IDs, digest and actor/time metadata remain for durable idempotency. Expired uncommitted payloads are cleared opportunistically on the next preview request, not by a timer. TICKET-127 (the scheduled data-retention job) must clear abandoned preview CSV/table snapshots and apply the configured post-wedding retention boundary to receipt actor IDs and invitation-ID arrays; preserve only non-identifying digest/count evidence when required for anonymous accounting. TICKET-168 verifies deletion across these stores. Until those tickets ship, expiry is an authorization bound, not a promise of immediate disk erasure. Local synthetic seeding also clears receipts so fixture resets cannot leave stale references. Production deletion of receipts would remove durable replay protection and is not part of normal import.

## Migration and rollout

Apply generated `0021_guest-import-batches.sql` before exposing the UI. It adds one RLS-enabled table and preserves existing data/policies. Roll back application code first; retaining the private table and committed receipts is safe. Do not drop receipts merely to retry an import.
