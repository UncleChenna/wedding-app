# TICKET-216 Phase 0 handoff — 5 November 2026

Owner: ihemegodsfavour8-lang. Branch TICKET-216. Managed worktree:
/private/tmp/wedding-phase0-local/.worktrees/TICKET-216. Base develop
c9c9e66010ee773189477139d4f8b0d30cf481e1. Source PR #92 head
7ea316ba4bddcfcb418e7c180c2fae03af81e618. Status In progress; no PM acceptance.

## Preserved decisions and environment

Full approved brief, PM direction, decision register, detailed 17-section
requirements checklist, phase status and dated implementation plan are recorded.
The separate UI-polish amendment's exact text is unavailable; known polish rules
are retained and the missing source is explicit. Reuse rather than rebuild.

Fresh managed setup outside iCloud installed identical frozen dependencies and
applied develop's 13 migrations to local project wedding-08f6ded40082 (DB25881,
app25890, browser25891). Original Desktop worktrees, uncommitted audit/portrait,
TICKET-212 source and installed caches are unchanged. No protected cache move,
new human approval record, version change or hosted operation was needed.

## Evidence and pending work

Local migration inventory proves all 13 current-develop SQL hashes/timestamps
and all 9 old TICKET-211 SQL hashes/timestamps match their separate applied chains.
Only the first six entries are common. The old stack was queried read-only and
must not receive the divergent develop chain. Hosted history is unknown.
See docs/plans/TICKET-216-migration-history.md and ignored artifacts/TICKET-216.

Next: virtually reconcile schema/behavior, prepare generator-produced append-only
migration preview and exact-path human proposal if required, then resolve source
conflicts with both behavior/test sets retained. No working-source migration
rewrite or integration merge has happened yet. Run clean/populated local,
RSVP/concurrency/retry/deadline/history and controlled production browser checks;
record the integrated SHA and final-commit CI in a draft checkpoint. No claims of
integrated verification, PM acceptance, deployment or wedding readiness.

TICKET-215's harness changes belong to another owner and are not merged here.
TICKET-212's server helpers remain the intended Phase 1 reuse source. Keep the
legacy destructive bridge blocked for its separate target plan/backup/restore
rehearsal/execution authorization. No shared develop/main merge or real send.

## 6 November continuation — 18:20 UTC

Status In progress; no PM acceptance. Source heads remain develop c9c9e66 and
TICKET-211 7ea316ba. Exact pnpm 12.14.0 was restored through Corepack into
/private/tmp/wedding-phase0-corepack-20261106 after its earlier temporary cache
lost its executable. Project versions and lockfile are unchanged. A temporary
two-hour caffeinate process began at 17:40 UTC; no power settings changed.
Neither sleep nor the overnight tool interruption establishes a failure cause.

Checks actually run:

- Production build on ae13c7085776666e6483d9a5359002d6c853a314 passes.
- Default four-worker production controls: 72 envelope first-visit cases and
  78 invitation-letter cases pass (three repetitions, mobile and desktop).
  Timeouts, assertions and retries are unchanged. These are baseline controls,
  not integrated PR92 verification. Original keyboard timeout cause unresolved.
- Original trace records a reply-focus expectation lasting about 28.4 seconds
  within an overall 30-second timeout, despite its logged 5-second expectation
  timeout. This does not prove that the expectation itself failed.
- Nine lineage contracts plus three opt-in local migration-preview cases pass.
  Preview covers clean/migrate-twice/RLS, populated preservation and ambiguous
  attendance refusal with full DDL/journal/data rollback. The original backfill
  failed the ambiguity assertion before the new guard. Earlier fixture setup
  errors are retained but are not regression evidence.
- verify:quick passes lint/types and nine unit cases; three local DB cases skip
  by opt-in design. They were explicitly enabled and passed separately above.

Logs are ignored artifacts/TICKET-216: develop-baseline-build.log,
production-default-control/results.json, letter-default-control/results.json,
history-and-preview-green.log, migration-ambiguity-regression-red.log,
preview-support-quick.log and original-focus-failure/trace.zip. The initial
letter run could not bind its local port inside the sandbox; its subsequent
normally approved server run passes. No protection was disabled.

New source includes scripts/migration-history.ts, nine contracts, two public
history manifests and integration-migrations.test.ts. The lineage helper is
NOT wired into migration execution yet. Actual protected migration source is
unchanged and the merge has not started. The generator preview is ignored.

The 13-path source-only human proposal is
artifacts/TICKET-216/migration-source-approval-for-human.json, expiring
2026-11-06T19:01:40Z (13:01:40 Regina). Human creation of the worktree's ignored
.harness/approved-writes.json is required. Never create it, reuse the expired
T211 record or extend its expiry. After expiry prepare a new proposal only.

Next after authorization: archive original fork bytes, reconcile all 16 conflicts
by intended behaviour, generate actual append-only 0013-0015 with db:generate,
wire lineage refusal and test adjacent party/member writer coherence. Then run
the full RSVP/database/default-worker gate and obtain CI for the integrated SHA.
Hosted history, original timeout cause, final integrated behaviour, complete
guest sessions and real-device/wedding readiness remain unverified. Destructive
legacy execution stays separately blocked by target plan/backup/restore/explicit
execution authorization. No shared merge or real guest message is authorized.

Full unit suite then passed with normal local-server permission: 1,034 passed,
99 skipped across 116 passed/19 skipped files, 45.76s, default worker settings.
The retained sandbox run had 15 failures and three EPERM unhandled errors; none
remain in the normally permitted run. This is pre-integration evidence only.

Draft checkpoint: https://github.com/UncleChenna/wedding-app/pull/106. Initial
preparation ff43175ccb4c971f4a90aede23d21346e6114712 is pushed; GitHub CI is
available and real jobs started. Optional review skipped; it is not technical
verification. Obtain final-head results after changes; source integration pending.

Provenance now exists in docs/migration-history: three SQL files, three snapshots
and original journal, produced through Git archive and verified byte-for-byte
against full 7ea316ba source (seven matches), with public hashes in the manifest.
Active drizzle source remains unchanged. Hook false-positive follow-up for its
owner: quoted documentation containing Git command words must not be classified
as an executed shell mutation; preserve main/develop write rejection. No hook
changed. Use worktree-scoped commands for actual Git actions.

## 6 November 18:48 UTC checkpoint correction

Preparation dca3f197f7c4fc0e22472f6818e853f8fe4edb7a passed all five required
CI jobs in run42270756098 (full verify completed18:43:56Z). Unit 1,034 pass/99
skip; browser837 pass/189 skip using two workers; no failed/flaky summary.
Optional review skipped. Corrected skip wording:18 database files plus one PDF
visual-review case, not19 database files. Original brief word-sequence comparison
shows all3,028 original words preserved in order; only37 introductory words added.
No separate UI amendment was found in either earlier supplied attachment.

Additional read-only review notes in ignored
artifacts/TICKET-216/adjacent-conflict-findings.md flag the seed's station-order/
registered-device/member-response union and global-window versus household
reopening mismatch. Test page visibility and both writers after integration.

Human record still absent. Current ignored source-only proposal was refreshed
for review at18:46Z; expiry2026-11-06T20:46:02Z (14:46:02 Regina), same13 exact
paths and exclusions. This updates only a proposal, never a human record.
Use its actual current contents and future expiry when reviewing. The protected
merge remains pending; source approval does not permit hosted/destructive use.

## 6 November PM review response

PM requested the full plan/JSON inline because local paths are inaccessible.
Rechecked archive7 files, old baseline13 SQL/snapshots and journal; all match.
Latest preparation47eecd068dcb9f0278d9c5630219d08bdcb80cca passed every required
CI job in run42274183457; optional review skipped. A fresh source fetch found
develop6fb465347a1426112783a7bf07860d2b71a8c493 with PR91/outbox0013. Old proposed
0013-0015 now collides. Full source review updated: preserve develop0000-0013,
append0014-0016, same13-path count and source-only purpose but revised exact names
requiring human review. New ignored Drizzle preview preserves14 source SQL and
snapshots plus14 journal entries; three appended SQL files match the previously
tested preview byte-for-byte. Current-base database tests remain unrun. The
lineage helper remains unwired; never claim db:migrate already rejects forks.

Proposal refreshed only (no human record), expiry2026-11-06T23:01:38Z,17:01:38
Regina. Existing working branch/base/database/protected source are unchanged;
virtual merge/generated preview only. Use system Git for merge-tree --write-tree;
the old default Git does not support it. Next after human source review: integrate
current base, generate canonical artifacts, wire and test refusal, then new-base
clean/populated/RSVP/default-worker/full CI gates. No hosted/legacy execution,
shared merge or PM acceptance.

## 7 November PM recheck

PM accepted the prior source plan in scope only, not Phase0 or hosted execution.
Fresh fetch: develop205cc66350864c0a4f57c392db7b663ff20bf25c now adds photo0014
through PR107. Old reviewed base6fb4653 already had outbox0013. Reverified all14
prior SQL/snapshots and journal prefix unchanged;7-file fork archive still exact.
Revised candidate mapping must be0015 key/0016 foundation+capacity/0017 backfill,
subject to review. Expired proposal untouched; no record creation command or
human file was generated. See the dated develop-drift report for exact paths.

Also corrected an omission: conventional develop merge from this older checkout
carries5 additional protected upstream files (0013/0014 SQL+snapshots and lockfile).
The current hook has no upstream reuse exemption. A combined exact-source-copy
plus generated-source record would be18 paths; earlier13-path scope acceptance
does not approve it. Static analysis only; no merge rejection or bypass claimed.

Read-only proofs are ignored artifacts/TICKET-216/2026-11-07-develop-review.json
and2026-11-07-upstream-carry-over.json. All required CI passed for previous
preparationefd02fb; no claim for current/future integration. No tests needed for
this read-only/source-doc review beyond integrity and formatting/link checks.
Next: PM review changed mapping and carry-over scope, then fresh exact JSON and
human terminal command. Afterwards perform the already requested actual entry
point guard, command refusal and integrated fixture/RSVP/final-CI verification.
Keep hosted/legacy/token/shared-merge restrictions. No PM acceptance.
