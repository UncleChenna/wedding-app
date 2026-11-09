# TICKET-098 handoff — 2026-11-08

## 2026-11-09 — resumed integration

Integrated develop `37e9202cca611c0c9d68b5749340066ab4e2ce97` without conflicts;
no application source changed. Read the updated TICKET-217/218 workflows: normal `t:pr`
now requires quick verification with full CI. Quick checks and 20 focused theme/
action regressions pass; TICKET-098’s database remains stopped, so TICKET-043 keeps the database slot.
Current PR evidence is `docs/plans/TICKET-098-pr.md`. Root will check the final
head and all five CI checks before merge. Earlier full local evidence below
remains tied to its original base; no new device/Lighthouse/CLS claim is made.

## Final review gate — 2026-11-08

The forced PR workflow passed on integrated develop
`407fb68db4dde004cf0868274a744ebd435dbbb2`: lint/types/format/tickets/build,
1,106 unit passes (118 opt-in skips), and 851 mobile/desktop smoke passes
(195 opt-in skips; 8.7 minutes). TICKET-098 is in review on PR #110.
Source integration commit: `1337e46e`; status transition: `3d9c7aa6`.
Six publication database tests and the authenticated editor journey also pass.
No production source changed after the separate review beyond the clean,
reviewed develop integration. Final log: `/tmp/TICKET-098-final-pr.log`.

Earlier outage failures and their unchanged recovery are retained below as history.
No test, timeout or runtime protection was weakened. Physical devices, fresh
Lighthouse and theme-studio exact-zero CLS remain unverified in TICKET-201.
The owner authorized proceeding through review with these release gates retained.

Resource lesson: both broad-run interruptions coincided with unhealthy local
Supabase databases; keeping the other idle owned stack stopped allowed the full
unchanged gate to pass. Schedule database-heavy verification and preserve backups
when releasing idle owned stacks. TICKET-218 and TICKET-213 already address stack
pressure; do not create a duplicate resource ticket or stop collaborator stacks.

Local stack `wedding-d904697e7ce4` stopped after all verification with `backup:true`; see `/tmp/TICKET-098-stack-stop.log`. No more local database use is planned. Next: check final PR head and CI, then merge only if clean under standing authorization.

## Earlier implementation record

Owner: divine. Agent: codex. Branch/worktree: `TICKET-098` / `.worktrees/TICKET-098`.
Base: develop `2706b96ddd0c7fa12c2e499f302d7e21e3108fde` (approved PR104 merge).

Implemented the protected theme studio, links, scoped invitation/order previews,
curated font and colour controls, and reuse of TICKET-181 save/activate actions.
No schema/dependency/security-policy change. App port31130; browser server31131.

Verification before final layout correction: full gate passed (1,091 unit tests,
107 skipped; 851 smoke cases,195 skipped). Authenticated browser journey passed,
including invalid save, reload, publication, no-JS guest SSR and24 Axe/overflow checks.
Screenshot inspection found narrow desktop preview using public two-column layout;
corrected embedded mode only and added image-above-names regression assertion.
Final quick/build/browser run: `/tmp/TICKET-098-final-{quick,build,browser}.log`.

Final quick/build/browser run passed; corrected invitation screenshots inspected.
Published draft PR: https://github.com/UncleChenna/wedding-app/pull/110
Implementation commit: `1c6bc42ed555da90d7c404de27925c949377ecd4`.
CI run42473321130 is running; no passing CI claim yet.
Next: obtain the pending UI review exception, check CI, then use `pnpm t:pr TICKET-098` to advance to review. Physical-device and fresh Lighthouse/CLS checks
remain unverified; no review exception for098 yet. Do not merge without approval.

Lesson: overflow assertions alone miss severe text wrapping. Inspect actual
embedded layouts; viewport breakpoints do not represent a preview panel's width.

## 2026-11-08 — independent review corrections

The user authorized continued implementation, independent review and verified PR
merges while release checks stay mandatory. Fixed stale draft activation with an
expected-token comparison inside the existing locked publication transaction;
removed embedded development-route links; restored heading focus on embedded
order step transitions without mount-time focus theft. No schema changes.

Quick verification and all six isolated publication DB tests pass. The expanded
authenticated browser journey passes (27.8s), including two tabs, conflict
preservation, reload/activation, keyboard focus and 24 Axe/overflow combinations.
Refreshed screenshots; inspected the Ivory desktop invitation and Emerald mobile
order examples. A separate read-only reviewer found no blockers in these fixes.
Full verification reached 1,095 unit passes/108 skips and a passing build, then
837 smoke passes/195 skips/14 desktop failures when the local database became
unavailable. A diagnostic `/p/invalid` request returned HTTP 503; invitation/pass
and PWA-return checks received the retry page. Evidence:
`/tmp/TICKET-098-review-verify.log`. One subsequent action-boundary test also
passes (eight action tests total). All 14 failed browser checks passed unchanged in a serial rerun (21.0s)
after local database recovery. No stack was restarted by this work. Next: run
the full review gate through `AGENT_OWNER=divine pnpm t:pr TICKET-098`. Physical devices, fresh
Lighthouse and exact-zero CLS remain unverified in TICKET-201.

Lesson: compare validated tokens after JSON normalization because optional
undefined fields are omitted by persisted JSON. For keyboard testing, scroll
below-fold native controls into view before focusing and using arrow keys.

## Current develop integration

Integrated `407fb68db4dde004cf0868274a744ebd435dbbb2` without conflicts. The seven
inherited migration artifacts (0016–0018, their snapshots and journal) match
fetched develop exactly. Applied only to TICKET-098's isolated database: both
migration runs succeeded, post-run row counts match exactly, and all 20 public
tables have RLS enabled. No reset or new migration was introduced. The final
review gate runs against this integrated base; earlier outage evidence is retained.

Integration quick verification passes. The existing failing-stop regression
runs against the real dirty worktree and checks protected paths before its fake
pnpm; recorded the user's standing authorization for the seven exact unchanged
Drizzle artifacts so that check can exercise its intended failure path. No hook
or test was weakened. The integration and its six publication DB tests pass.
