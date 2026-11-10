# TICKET-174 — admin scan log

2026-11-10 · divine / codex · branch `TICKET-174` · PR [151](https://github.com/UncleChenna/wedding-app/pull/151) (draft).
Base: `7533201c21af3119e26f7a94b1e2985700584307`.

## Implementation

Admin-only `/admin/scans` with validated invitation/staff/device/time/verdict/source/conflict filters,
separate reported/received timestamps, all five verdicts and unknown invitation attempts.
Resolution notes use predefined choices, verified server authorship, unique retry identities,
and append-only PostgreSQL guards. Original admission evidence and counts remain unchanged.
Only the latest 20 notes per event are displayed; all remain stored.

Generated additive migrations 0028/0029, schema/repository/service/actions/components, focused
unit/SQL tests and authenticated browser scenario are committed. Existing synthetic seed reset
restores the new named guard. Admin journey runner includes this scenario and sanitized artifacts.

## Verified evidence

- Seven real PostgreSQL scan-log tests pass, including concurrent replay, privacy, filters,
  immutable evidence, RLS and reset guard restoration.
- Twelve seed/admission tests pass. Migrations applied twice with identical counts; all 25
  public tables retain RLS. Schema generator reports no drift.
- Expanded focused suite: 34 passing tests. Latest form/service retry changes: 12 passing tests.
- Independent review identified and verified fixes for stale filter controls and uncertain
  note retries. Request identity and resolution now survive failed transport and server refresh;
  only a positive acknowledgement permits a new request identity.
- Latest changed-file formatting and lint pass. Previous typecheck passes; final checks pending.
- Initial full unit invocation failed sandbox IPC/loopback permissions, not accepted as a pass.
  Elevated serial run is underway; see `/tmp/TICKET-174-full-unit-elevated.log`.

## Remaining work

Inspect final full-suite outcome, commit/push latest retry and explicit axe assertion changes,
then obtain authenticated browser evidence from CI. No local Supabase Auth is available;
no authenticated screenshots, axe, CLS or device checks are claimed complete yet.
Review the resulting 24 theme/viewport images, resolve failures, update acceptance criteria and
PR evidence, run normal ticket publication, recheck final-head CI and independent review before merge.
Physical-device/performance release gates remain mandatory in TICKET-201.

## Local resources and lessons

Owned native PostgreSQL port 31101 is stopped with data preserved; its directory is recorded in
`.harness/temporary-postgres-path`. Use explicit DATABASE_URL with `pnpm exec drizzle-kit migrate`:
the convenience db:migrate command starts Supabase. Never start or reset collaborator stacks.
Add `/Users/chenna/.npm-global/bin` to PATH for hooks. Full tests require permitted local IPC.
The 0029 mutation-keyword hook warning refers to a CREATE TRIGGER that rejects mutation;
exact-path authorization records the standing user instruction and reviewed additive SQL.
No production database application occurred.

## Verification update — 2026-11-10

Elevated serial full unit suite: 1,883 passed, 204 conditional skips, 235.38 seconds;
critical coverage 98.33% lines / 98.56% branches / 100% functions.
Authenticated CI produced all 24 synthetic screenshots and passed filters/note persistence,
but failed the final clear-filter assertion because a label locator also matched named
articles. The locator now targets the invitation combobox. Retry identities use separate
allowlisted synthetic email addresses so an already enrolled TOTP account cannot block retry.
The first screenshot set was reviewed across all four themes at three widths; final updated
CI, explicit axe assertion and navigation/header target measurements remain pending.

## Latest checkpoint

Head114931ae authenticated CI admin job129553524682 passed six browser cases without
retry and seven scan-log SQL tests. Final24screens downloaded to
`/tmp/TICKET-174-final-screens`, parentmobile review clean, independent desktop review
requested. Full CI watch66301/run42732398647 remains live; all acceptance criteria
are now proven, final whole-suite gate still pending. See final PR write-up for UI evidence.
