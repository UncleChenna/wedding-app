# TICKET-098 handoff — 2026-11-08

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
