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
