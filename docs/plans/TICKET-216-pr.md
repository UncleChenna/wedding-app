# Ticket

Ticket: TICKET-216. Dependency: draft PR #92 (TICKET-211). Target: develop.

# Summary

Prepare the PM Phase 0 integration without losing current develop or the older
household foundation. Preserve the approved brief and detailed requirements,
establish a reversible local environment, inventory both migration histories and
add tests for an append-only candidate. This draft does not yet integrate PR92.

# Changes

- Record the full approved brief, PM execution direction, decision register,
  detailed requirements checklist and six-state phase tracker. Nothing is PM accepted.
- Use a fresh managed local checkout outside iCloud with unchanged frozen dependencies;
  keep original caches/worktrees/uncommitted work untouched.
- Pin the real 13-entry develop and divergent nine-entry T211 migration histories.
  Add a strict prefix comparison helper with nine tests (execution wiring pending).
- Add three guarded disposable-database tests for clean/idempotent/RLS behaviour,
  populated preservation and ambiguity rollback. Run against an ignored
  Drizzle-generated preview; actual source merge awaits human exact-path approval.
- Document all 16 conflict paths and the adjacent party/member writer consistency risk.

# Acceptance criteria and evidence

Decision preservation and fresh environment are implemented locally. Migration
inventory, preview and baseline controls are recorded in the handoff and plans.
Remaining: human source record; actual reviewed source reconciliation/generation;
lineage execution wiring; party/member consistency; integrated RSVP concurrency,
retries, deadline/reopening/history checks; full gate and CI for the integrated SHA.
All ticket criteria remain unticked pending the full checkpoint and PM review.

# Verification

- verify:quick: lint/types pass, nine tests pass, three opt-in DB cases skip.
- Full unit suite, unchanged default workers: 1,034 passed, 99 conditional skips; exit 0.
- Explicit history plus local migration-preview suite: 12 passed; exit 0.
- Production baseline build: passed at ae13c7085776666e6483d9a5359002d6c853a314.
- Default four-worker production controls: 72 repeated envelope cases and
  78 repeated invitation-letter cases passed, no skips. Original timeout unresolved.
- A restricted sandbox unit run failed 15 cases with socket errors; unchanged
  normally permitted run passed. Both logs retained; no protections weakened.
- CI for this draft head: pending query after publication. No final integrated SHA exists yet.

See docs/plans/TICKET-216-verification-limits.md for skips and unverified requirements.
Local ignored evidence lives in artifacts/TICKET-216; exact files are in the handoff.

# Risks and rollout

Not deployable and not PM accepted. The old chain shares only six migrations with
develop; preserve applied bytes/order and refuse divergent targets. Actual append
0013-0015 source is not included yet. The preview refuses ambiguous aggregate
attendance rather than inventing individual answers; it preserves existing people
and RSVP rows. Hosted history is unknown. No hosted migration, real data deletion,
token reissue, real messaging or shared-branch merge is authorized. The destructive
legacy bridge needs separate target review, verified backup, restore rehearsal and
explicit execution authorization. Original branches/databases are preserved.

# Screenshots and UI checklist

N/A for current changes: documentation, migration history helper and tests;
application UI is unchanged. Baseline browser controls do not constitute final UI
review or real-device validation. Full UI evidence remains required after integration.

# Harness changes

No hooks, assertions or test protections changed. The lineage helper is ordinary
source awaiting execution wiring; it does not grant migration authorization.
