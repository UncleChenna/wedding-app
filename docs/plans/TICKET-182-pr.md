# Ticket

TICKET-182

# Summary

CSV uploads can now be validated and approved before creating any invitations. A confirmed preview creates all households atomically; double clicks, concurrent submissions and a later upload of the same normalized file return the original receipt rather than duplicate guests. TICKET-091 supplies the upload UI.

# Changes

- Bounded strict CSV parser: 256 KiB, 300 rows, required headers, quoted commas/newlines, Unicode, normalized email/phone, explicit household grouping, row errors and 0–10 tag-along places.
- Authenticated preview/commit actions use the current MFA-approved admin identity. New invitations are secure-token drafts; existing guests, RSVP answers and admission evidence are never changed.
- Generated migration `0021_guest-import-batches.sql` adds one private RLS-enabled preview/receipt table. Digest uniqueness and transaction locks prevent duplicate commits; expired/changed previews and changed tables/contacts are rejected.
- Error downloads reuse the existing spreadsheet formula-neutralization policy. Local synthetic seed resets clear import receipts too.
- Public action/types, file format, duplicate policy and retention details: [guest-import contract](../blob/TICKET-182/docs/guest-import.md).

# Acceptance criteria and evidence

- Headers/bounds/contacts/grouping/tag-alongs: nine parser tests cover malformed quoting, quoted multiline Unicode, duplicate headers/member/contact errors and spreadsheet formulas.
- Duplicate household/contact policy and stable identity: documented create-only behavior; database regression proves normalized CRLF and reordered household re-preview returns the same committed IDs; cross-admin replay is rejected.
- Atomic approved preview: five real PostgreSQL tests cover later-insert failure rolling back earlier inserts, stale contact/table/expiry/renewal/digest/actor rejection, existing RSVP preservation, cleared raw CSV after success and separate-connection concurrent double submission.
- Independent read-only source review: no correctness/security blocker. Reviewer-requested replay cases were added. No UI in this ticket.

# Verification

- `pnpm exec vitest run src/modules/admin/__tests__/guest-import.test.ts src/modules/admin/__tests__/guest-import-actions.test.ts src/modules/admin/__tests__/guest-export.test.ts`: 18 passed.
- `RUN_GUEST_IMPORT_DB_TESTS=1 pnpm exec vitest run scripts/__tests__/guest-import.integration.test.ts`: five passed on isolated PostgreSQL, including after repeat seeding.
- `pnpm test`: 1309 passed, 145 skipped across 187 files. Skipped suites require their own database/browser fixtures; these are not claimed as run.
- `pnpm verify:quick`: lint/types/related units passed (89 passed,105 skipped before final evidence-only additions); rerun by commit/t:pr.
- `pnpm db:migrate` repeated: identical counts (`/tmp/TICKET-182-counts-first.txt`, `...second.txt`). `pnpm db:seed` twice: identical counts (`/tmp/TICKET-182-seed-first.txt`, `...second.txt`). All23 public tables pass `pnpm db:check-rls`.
- Full production build/browser gate runs in CI; no local full-browser claim.

# Risks and rollout

Apply the generated additive migration before enabling the import UI. No production application performed. Roll back code first; retaining the private receipt table is safe and preserves idempotency. Never drop receipts as a retry mechanism.

Preview approval expires after30minutes. Raw CSV is cleared immediately on commit, or opportunistically on the next preview request after expiry; this is not a timed deletion guarantee. Committed receipts retain IDs/digest/actor metadata. The future retention workflow must account for abandoned previews. Short table locks serialize import against other guest-list writes; the limit is300 rows and no external calls run inside that transaction.

Same names/shared contacts across distinct households are rejected for explicit correction, never silently deduplicated. No existing RSVP is overridden. Native UI/file decoding and end-to-end upload behavior belong to TICKET-091.

# Screenshots

Not applicable: backend only.

# UI checklist

Not applicable: no UI changes. Guest export output retains its existing formula regression suite.

# Harness changes, if any

No harness behavior change. Seed reset includes the new private table for deterministic disposable fixtures. An unrelated auto-generated PR-template change is excluded.
