# TICKET-211 migration and recovery

Status: implemented/tested only in the managed local TICKET-211 stack. No production migration or staging deployment has run. Human review is required before integration/deployment. Current product mandate: approved-requirements-2026-11-02.md.

## Review footprint

- drizzle/0006_member-rsvp-foundation.sql: additive kind/age metadata, revision/reopening columns, one response per member, composite household FK, scoped retry receipts, private legacy archive, default retention365. Every new table enables RLS; no browser policy is added.
- drizzle/0007_member-rsvp-backfill.sql: backfill pending/yes/no from existing aggregate responses; classify existing multi-person invitations as groups without inferring kinship/age; supersede historical90-day retention values with365.
- drizzle/0008_preserve-large-household-capacity.sql: preserve large-group allowances while retaining the nonnegative database constraint.
- Generated metadata: drizzle/meta/0006_snapshot.json, drizzle/meta/0007_snapshot.json, drizzle/meta/0008_snapshot.json, drizzle/meta/_journal.json. The SQL for0006 orders the referenced composite unique index before its FK; this dependency correction was reviewed before applying the new file. Applied0000–0005 files are unchanged.
- scripts/migrate.ts / safe-migrate.ts: existing target guard remains mandatory. Standard installs use the Drizzle migrator. Verified bootstrap conversion executes the same pending SQL inside one enclosing transaction and records its actual hashes/timestamps; no migration is falsely marked applied or rewritten.

## Ordinary current-schema upgrade

1. Confirm exact release commit, target identity, absence of application writes and verified cloud backup/restore rehearsal.
2. Use the environment's secret store; never copy a developer env file to production or print DATABASE_URL.
3. Run `pnpm db:migrate` before serving code that queries the added columns. Run it twice in isolated staging and compare `pnpm db:counts`; the second run must not change counts or journal length.
4. Run `pnpm db:check-rls`. New tables remain inaccessible to browser publishable credentials. Use minimal authorized server DTOs, not new browser grants.
5. Check person/household/aggregate reconciliation, unknown age bands, receipt uniqueness and actual pass behavior. Legacy aggregate rows remain for signed-pass compatibility, but member_rsvps is the new attendance authority for member-aware mutations.
6. Deploy the reviewed app version privately, require stale guest forms to refresh, and run synthetic invitation/RSVP/pass/Auth flows. No public audience change is part of this work.

## Populated original0000 bootstrap

A plain migration now fails closed with actionable copy instead of encountering a NOT NULL error partway through deployment. The controlled path requires `pnpm db:migrate --upgrade-legacy`. If the old codes lack the current token format/entropy policy, a separate explicit `--allow-legacy-token-reissue` is required. Never add this flag routinely to deployment automation.

Rehearse on a verified isolated restore, disable application writes, take a protected backup and obtain the operator's explicit go/no-go. Old tokens matching the current format are retained; this format check does not establish their original entropy, which the operator must review. Weak12-character bootstrap codes cannot be described as secure private links: when explicitly approved, replacements are cryptographically generated and original codes remain in restricted archive records. Review and redistribute links deliberately; no message is sent by migration.

The bridge verifies the original bootstrap journal hash/timestamp, takes an advisory lock and exclusive locks on invitations/guests/rsvps/check_ins, validates all source records, then temporarily empties only those four tables without CASCADE. It executes every unchanged pending migration and restores mapped rows/IDs, contacts, dietary notes, table references and check-ins before committing. Original records, including pending RSVP IDs and old per-person QR codes, are archived under RLS. Pending replies become actual pending member state, not false/declined responses. A failure rolls back schema, data and journal together; injected-failure regression verifies this.

Unsupported/ambiguous states fail before data changes: missing/mismatched migration history, nameless attending people, unknown country-code phone input, unexpected FK dependencies or inconsistent legacy attendance/party data. Those cases need a separate reviewed conversion, never deletion or silent truncation. Do not guess country, age or kinship, or merge matching contacts. No production database has been established to have those conditions. Migration0008 removes the historical arbitrary ten-companion ceiling so a large group keeps its original allowance; no extra people are invented or approved by this conversion.

## Recovery and rollback

Do not roll back by dropping member/history/archive tables. Stop application writes, preserve the failed deployment and use the tested prior application version only if it remains schema-compatible. Legacy conversion is transactional, so a failed conversion retains the old schema and original rows. A committed conversion is recovered from the verified cloud backup into a separate target with reconciliation, or fixed forward through reviewed migrations. Restoration to a live service requires an operator-controlled cutover; this local failure rehearsal is not a cloud backup restore certification.

Keep archive access admin-only and treat it as personal/credential data. The one-year retention requirement starts at configured event end (proposed default per mandate); expiry/deletion, scoped preservation holds and backup expiry are not implemented by a365-day setting and remain launch work. Append-only history is not an excuse for indefinite retention.

## Local evidence

artifacts/TICKET-211 contains red/green boundary tests, integration-final.log (19 cases), upgrade-final.log (6 upgrade cases, including large households), current-schema migration logs, build.log, quick.log and live-rsvp.log (10 real mobile/desktop cases). Fresh reset/reseed and repeat migrate/seed counts match; RLS is enabled on all15 public tables and the generator reports no drift. Visual review passes all12 cases/60 states; full gate remains blocked by the human approval record. Test fixture cleanup is strictly managed-local, invitation-ID-scoped, transactional and never a production retention mechanism.
