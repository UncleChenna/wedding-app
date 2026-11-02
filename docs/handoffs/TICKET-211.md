# TICKET-211 handoff — 2026-11-02 10:48 UTC

Owner: ihemegodsfavour8-lang. Agent: codex. Branch/worktree: `TICKET-211`, `.worktrees/TICKET-211`. Base develop: `2f066ebbb175c4b8d42b0ab6f54545134f52f592`. Ticket status is blocked in the shared ledger and pushed as `00f5382` (initial branch commit `22d8ede`). Documentation/evidence are being pushed separately; application/migration implementation below is currently uncommitted because the required human migration authorization record is absent. No PR yet. Do not infer remote availability of these changes from the existing branch.

## Result and changed areas

The owner replaced historical product assumptions with the full mandate in `docs/approved-requirements-2026-11-02.md`. `docs/implementation-checklist.md` maps it to current evidence and all remaining launch work. This ticket implements the first data/member RSVP foundation, not the full application.

- Schema/generated0006–0008: household kind, age band without verification claims, revisions/reopening, one current member response, composite household membership FK, retry receipts, restricted original-record archive, retention365 default, preserved large-group allowance. Every new table enables RLS with no browser policy; applied0000–0005 are unchanged.
- Member mutation: private capability/status and membership checked under invitation row lock; mixed individual attendance/diet, expected revisions, scoped request UUID/fingerprint, replay handling, deadline and household reopening, atomic before/after history. Aggregate state is a compatibility projection for the existing signed pass. The existing simple yes/no form supplies revision/retry metadata and reports conflicts/cutoff without false success. Full member editor/approvals/sessions remain missing.
- Safe migration CLI: normal Drizzle path retained, managed target guard before connection. Original populated0000 requires explicit reviewed upgrade and a separate flag to replace obsolete short codes. Original database JSON and timestamp precision preserved, stable IDs/contacts/check-ins/response meaning restored inside the same transaction as real pending SQL/journal rows. Unsupported/ambiguous data refuses conversion. Injected failure rolls back schema/data/history. No production operation run.
- Deterministic seeds/reset include new data. E2E cleanup is ID-scoped, transactional and managed-local; it handles append-only history without becoming a production deletion path.
- Rollout, recovery, external blockers, operating-draft and ADR0022 are documented. No messaging, deployment, service purchase or production migration. Existing audit and portrait remain untracked and unchanged.

## Actual verification

Evidence is local under ignored `artifacts/TICKET-211/`; concise review and representative screenshots are tracked under `docs/reviews/TICKET-211/`.

- Red/green validation, concurrency, upgrade and raw-archive regressions recorded. `integration-complete.log`:37 cases pass across six database suites. `upgrade-precision-final.log`:6 upgrade cases pass after precision fix. That final bridge change does not touch RSVP runtime logic.
- Fresh/current migration, no schema drift (`drift-check.log`),9 applied migrations; repeat counts identical (`counts-before.txt`, `counts-after-1.txt`, `counts-after-2.txt`). All15 public tables RLS enabled (`rls.log`).
- Deterministic seed twice:110 invitations,248 people/member responses,85 aggregate responses,30 check-ins,28 tables; all counts identical (`seed-counts-1.txt`, `seed-counts-2.txt`). Fresh reset/reseed passed and counts match in `reset-fresh.log`, `reset-reseed-counts.txt`.
- `live-rsvp.log`:10 mobile/desktop browser cases pass, including JS/no-JS persistence, token tampering/revocation, two-device stale edit, deadline after rendering. `pass-review.log`:4 additional signed-pass/RSVP cases pass using ephemeral process-only signing key.
- `visual-review-settled.log`:12 cases pass,60 states across four themes at375/768/1280. Zero Axe A/AA violations,44px targets/no horizontal scroll, keyboard response focus and reduced motion. Inspected every state in contact sheets and representative original captures. Metadata is explicitly awaited after server-action streaming; no accessibility assertion was removed.
- `quick.log` passed (earlier related set); `targeted-final.log`:33 cases pass. `build.log`: production build passed. Latest required `pnpm verify` passes ticket validation, formatting, lint and types, then fails the unit stage:665 pass,42 opt-in skips,3 failures. All three failures are the unchanged protected-file hook requiring the human approval record, not a product-logic failure. No hooks/tests bypassed. Build/smoke are not reached by that failed full-gate run. Separate `pnpm test:e2e:smoke` passes697 cases with147 opt-in skips (`smoke-final.log`,4.7 minutes).
- No new Lighthouse/CLS score, physical WhatsApp/iOS/Android/camera/Authenticator tests, hosted Auth/deployment, cloud backup restore, operational load or staff rehearsal. UI review stays CHANGES REQUESTED for these missing required checks. No wedding-readiness claim.

## Blocking action and exact continuation

The repository hook (`scripts/harness/hooks.mjs`, `docs/collaboration.md:80`) requires the human to create ignored `.harness/approved-writes.json` naming the seven generated migration files. It says agents must not fabricate authorization. An unactivated proposal is ready at `artifacts/TICKET-211/migration-approval-for-human.json`; the owner was asked to review/copy it. Do not write the live approval yourself or disable the hook. It authorizes review/commit of generated files only, not production migration.

After the owner records approval:

1. Verify the exact paths/reason/unexpired timestamp; resume the ticket through CLI if blocked.
2. Use Node24 and system Git: `PATH=/opt/homebrew/opt/node@24/bin:/usr/bin:/opt/homebrew/bin:/usr/local/bin:/bin`, `COREPACK_HOME=/private/tmp/wedding-audit-corepack`. Never print/read `.env.local`.
3. Finish/reset evidence if its process is still running; rerun `pnpm verify` with hooks enabled. Full gate must pass before review; revisit actual defects, not check bypasses.
4. Update this handoff, ticket notes, matrix and PR body with actual final results. Stage only ticket-owned code/docs/generated migrations/screenshots; exclude the user's `WEDDING_APP_AUDIT.md` and `public/Elegant ivory wedding portrait.png`.
5. Commit/push `TICKET-211: ...`, open a draft PR targeting develop until required unverified UI checks are resolved; record URL through CLI. Never mark in_review/done contrary to enforced acceptance/gate conditions. The human merges. No further dependent implementation ticket can assume this branch is integrated.
6. Implement remaining phases from the complete checklist on new claimed tickets after reviewed foundations; preserve other owners171/172/209/022 work. Guest/staff permission scope precedes real check-in/orders. Obtain exported design source/assets before claiming fidelity.

## Lessons

Preserve raw original JSON inside PostgreSQL, not via Date serialization, when promising a legacy recovery archive. Materialize the entire prior member state before a partial change, otherwise aggregate fallback can incorrectly infer a previously unanswered member's answer. Current tests cover both issues. The generated composite FK must follow its referenced unique index;0006 was corrected before applying and schema drift is now empty. Do not modify applied migration files.
