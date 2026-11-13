## Summary

Add a required mobile Lighthouse gate for actual guest pages. A selected guest CI run fails when a page's three-run median Performance is below95 or any Accessibility run is below95; no score rounding or lowered target.

## Changes

- Pin Lighthouse13.6.0 and its default mobile simulated profile.
- Use isolated synthetic guests, actual completed RSVP, issued signed pass and confirmed table menu with real photo/font resources.
- Start a fresh Chrome instance per cold run and retain every raw report plus score summary.
- Fail closed on wrong URL, runtime error, HTTP failure, null/missing score or incomplete run count.
- Add the selectedguest Lighthouse lane to the existing required CI aggregate. Keep the separate actual200KB wire gate unchanged.

## Acceptance criteria and evidence

Policy regressions cover threshold boundaries, sub95performance/accessibility, null scores, redirects and runtime errors. Current production scores pending integration of actively implemented TICKET-038; this PR remains draft and does not claim launch readiness.

## Verification

Four policy unit tests pass. Quick lint/types/related units and CI parity pass. Nine-run production baseline intentionally waits for038integration to avoid testing an obsolete invitation layout. No physical device or CLS certification is claimed by this gate.

## Risks and rollout

CI will honestly fail on existing performance shortfalls; remediate source rather than weaken the95target. Three independent cold performance runs use their median; every raw score remains visible. Lighthouse is pinned through pnpm dlx, no new production dependency/service/secret. Disposable fixtures are retired with append-only history retained. No application UI changes, so screenshots/UI checklist are not applicable to this instrumentation change.
