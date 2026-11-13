## Summary

Add a required mobile Lighthouse gate for actual guest pages. A selected guest CI run fails when a page's three-run median Performance is below 95 or any Accessibility run is below 95; no score rounding or lowered target.

## Changes

- Pin Lighthouse 13.6.0 and its default mobile simulated profile.
- Use isolated synthetic guests, actual completed RSVP, issued signed pass and confirmed table menu with real photo/font resources.
- Start a fresh Chrome instance per cold run and retain every raw report plus score summary.
- Fail closed on wrong URL, runtime error, HTTP failure, null/missing score or incomplete run count.
- Add the selected guest Lighthouse lane to the existing required CI aggregate. Keep the separate actual 200KB wire gate unchanged.

## Acceptance criteria and evidence

Policy regressions cover threshold boundaries, sub-95 performance/accessibility, null scores, redirects and runtime errors. The merged hero is measured below; its median 90 currently fails the gate, so this PR remains a draft and does not claim launch readiness.

## Verification

Five policy unit tests pass. Quick lint/types/related units, CI parity and the integrated production build pass. The actual nine-run hero baseline is recorded below. No physical device or CLS certification is claimed by this gate.

## Risks and rollout

CI will honestly fail on existing performance shortfalls; remediate source rather than weaken the 95 target. Three independent cold performance runs use their median; every raw score remains visible. Lighthouse is pinned through pnpm dlx, no new production dependency/service/secret. Disposable fixtures are retired with append-only history retained. No application UI changes, so screenshots/UI checklist are not applicable to this instrumentation change.

## Current post-hero evidence

Develop `21722cb97d525a683e0fcd85a4007bbda5db9a76` is integrated in `2b60183f`. The runner now confirms the real hero image loads and local fonts are ready before cold measurements. Production build and the normal integration hook pass. The first local Lighthouse attempt returned `NO_NAVSTART` before producing scores; an unchanged retry completed all nine runs.

The actual hero invitation scores **94/90/88, median 90**, below the unchanged 95 target. The issued pass scores **98/96/96, median 96**; the menu scores **100/100/100**. Accessibility is 100 on all nine runs. This PR remains a draft; it does not claim the invitation passes. Exact scores, metrics and raw-report hashes are recorded in `docs/reviews/TICKET-116/post-hero-baseline.json`; complete reports are preserved in `artifacts/TICKET-116/hero-before-optimization/`.

The median invitation report has LCP 3.65s, TBT 61.5ms and CLS 0. Its hero transfers 27,622 bytes, is eager/high-priority/discoverable, and has zero image-delivery savings reported. TICKET-240’s scoped client-validator bundle reduction is the next measured remediation, after TICKET-242’s shared CI fixture repair is integrated. No limit or assertion has been relaxed. The owned isolated PostgreSQL service is stopped with data preserved.

## Current merged runtime comparison

A controlled second measurement used current develop `6765919f`, including the merged TICKET-240 parser reduction, TICKET-119 AVIF policy and TICKET-117 accessibility fixes. Four exact TICKET-116 measurement-tool copies were hashed, used only as temporary untracked tooling in the isolated TICKET-240 worktree, and removed after hash verification. This is a combined integration result, not attribution to one change.

The invitation scores **87/90/90, median 90**, so the gate still correctly fails. Pass and menu both score **100/100/100**, and Accessibility remains 100 for all nine reports. The median invitation has LCP 3.54s, TBT 14.5ms, CLS 0 and an 18,717-byte AVIF hero. Full reports and hashes are preserved in `artifacts/TICKET-116/merged-runtime-6765919f/` and `docs/reviews/TICKET-116/merged-runtime-baseline.json`. TICKET-244 tracks the confirmed unused Inter preload; the full Jost fallback for Igbo remains required. Both isolated databases are stopped with data preserved.

## Consolidated layout and console scope

Merged TICKET-228 folds TICKET-121 into this ticket. The implementation and original evidence from `c281bc43`, `b18f9da6` and handoff `a08b3a46` are preserved: the context-wide guest error/CLS guard, three explicit negative proofs, positive guest journeys, cold-font placeholder repair and all 12 original screenshots. Original evidence stays under `docs/reviews/TICKET-121/`; the original PR196 remains available until this transfer is verified. TICKET-121’s canceled metadata is not revived.

The integration retains both the existing visual-regression CI job and this Lighthouse job in the required aggregate. The positive route check additionally visits the public home page. Fresh integrated browser verification is still pending; no prior screenshot is claimed as a new build check. The invitation performance gap remains open.

## Measured font/layout repairs

The consolidated guard exposed real home/staff cold-font shifts and a complete-Inter download for the actual Igbo meal. Stable text origins remove the shifts. Generated common fonts retain Latin-1, supported Igbo and canonical decomposition marks in one shaping face, with complete fallback preserved. All20 focused browser cases, four real guest/order journeys and six font unit tests pass; three explicit negative guard proofs fail exactly as intended. Review details and12 current screenshots: `docs/reviews/TICKET-116/font-layout-remediation.md`. This source change now includes UI/font repairs; the earlier instrumentation-only UI N/A statement is superseded. Physical checks remain release gates and fresh Lighthouse measurement remains outstanding.
