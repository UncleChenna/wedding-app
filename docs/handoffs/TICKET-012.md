# TICKET-012 handoff

## 2026-10-31 — divine / codex / TICKET-012

Base f7e8fac048514058030d28d7b3a61f168de014f9. Worktree .worktrees/TICKET-012; isolated project wedding-4064897a35a1, DB29681, app29690. Active theme pair reader, internal activation service, server layouts and additive dark-theme column implemented as an unfinished checkpoint. No public activation endpoint. Existing active_theme_id is the light slot.

Verified: new suite first failed missing implementation; 23 unit tests passed, quick lint/types/related tests passed. Migration applied twice: all12 table counts zero and applied migration count5 both times; all12 RLS enabled. Seven opt-in database tests passed including pair persistence, preservation of venue and blank dark-theme rejection. First DB test failed because postgres-js transaction clients cannot be passed directly to drizzle; using Drizzle's own transaction fixes the test.

Pending: exact-path approval for generated SQL0004, snapshot0004, journal (local only, not committed); seed settings update/tests; actual cache invalidation and outage browser tests; full build/verify; all-theme UI evidence; documentation/acceptance refinement. No acceptance criteria marked done. Migration source schema is checkpointed but artifacts are deliberately pending approval, so this draft branch must not merge yet. If develop adds another migration, regenerate against the new base before approval/merge. No remote or populated database touched.

Next: await migration approval, finish verification. TICKET-030 physical QA deferral and TICKET-040 cache deletion were explicitly approved on31October; resume those isolated tasks while this waits. Handoff skill used. Avoid shell redirection to /dev/null: repository hook treats it as an outside-checkout edit.

## 2026-10-31 — resumed after explicit migration approval

User approved all three generated paths and recording authorization; c9808ca commits them. Branch resumed in_progress. Seeds now include the default pair; two local seed runs produce identical counts. Added three cache-wiring/timer tests. Live SQL revalidation browser test passed across four themes × three widths with JavaScript disabled and axe; twelve captures inspected. Initial full gate passed442 unit tests but caught two offline private-page cache failures; adding no-store proxy headers on admin/checkin/kitchen/order fixes all12 PWA checks. No test weakened. Full rerun pending.

Lighthouse home Performance100/99/100 and Accessibility100×3; CLS0.00007339025 is NOT zero. Record inherited preview QA limitation under201. Supabase012 is now stopped with backup=true, to test real fallback. Generated SQL approval is no longer a blocker. PR56 remains draft pending completion. 040's specifically approved cache was cleared; its build and all six live RSVP tests now pass. PR54 has release-blocking206 and is awaiting final CI retry (first failed resolving Google fonts).

## 2026-10-31 — privacy regression fixed and full gate green

Full rerun on base f7e8fac passed:442 unit,17 opt-in skips;451 browser,123 conditional skips; format/lint/types/build passed while DB remained stopped. Server fallback emits sanitized warnings. Preparing integration of develop c22d9d94105817f10c63b7dae239fd2d4f6686e6 (verified PR54 merge) before final t:pr verification. Lighthouse traces tiny CLS to the existing THE CELEBRATION web-font swap. Physical/strict-zero QA stays201 under the existing preview-only exception; no launch readiness claim.

## 2026-10-31 — final integrated gate

Integrated develop c22d9d94105817f10c63b7dae239fd2d4f6686e6 without conflicts. Mandatory t:pr verification passed458 unit tests/17 opt-in skips and483 browser tests/129 conditional skips; build/format/lint/types passed. PR56 is in_review. Final-head CI and ready-for-review publication remain before the authorized merge. TICKET-207 records recurring cold Google-font/Turbopack failures; no font implementation is included. The approved migration and all source/evidence are pushed. Stack012 remains stopped with backup preserved.

## 2026-10-31 — RSVP integration and cold-font diagnostics

PR56's final CI run41185615131 failed admin desktop CLS0 with0.00006491546630859375; no merge performed. Resumed ticket via CLI and integrated verified develop7191d981231d9fb71f101d308abc05fa4ec79501 as2c2c94f. Proxy merge retains private no-store headers and the validated RSVP POST path.

Investigated retained CI screenshots/trace. Mac delayed-font runs and the matching Playwright1.64.1 Linux image with CPU throttling and separate heading/body font delays all reported no shifts. This does not prove the prior failure fixed. No speculative production CSS/font change made. The existing zero-CLS regression now covers both ordinary and delayed font loading, waits for the final paint before interaction, and reports shifting source nodes/rectangles. Focus assertion retained. Four targeted mobile/desktop cases pass.

Integrated full local gate passed467 unit tests/22 opt-in skips and483 browser tests/129 conditional skips, format/lint/types/build, with DB stopped to exercise fallback. Five real RSVP database tests then passed after restarting only stack wedding-4064897a35a1. Later addition of ordinary-load coverage adds two browser cases and requires final t:pr gate/CI. Diagnostic CI run41196773149 is still active on495dc4e; inspect its result rather than assuming a pass. No tests weakened. Approved migration unchanged.

Local diagnostic images/scripts are ignored under artifacts/TICKET-012; no new project dependency. Temporary Docker browser containers removed automatically. Stack012 currently running with preserved synthetic seed; do not reset. Final merge requires final-head required CI and existing UI release limitations remain201. TICKET-207 remains the cold-font build reliability follow-up.

## 2026-10-31 — diagnostic failure identified and fallback repaired

Diagnostic CI41196773149 failed with exact source: Welcome back text moved from(x408,y109) to(x407,y106), CLS0.00006491546630859375. This proved a display font swap, not moving controls. Added explicit metric-compatible local fallbacks for all four registry fonts, using the installed Next calculateSizeAdjustValues values and Times New Roman/Liberation Serif or Arial/Liberation Sans. Primary fonts, weights and swap unchanged. CSS must be imported by the font registry module: importing it after Tailwind omitted the face from this build, caught by the new browser font-load assertion.

Correction to earlier Linux evidence: host.docker.internal reached HTML but did not load the styles under production CSP, so those early zero-shift runs were INVALID and are not evidence. The diagnostic now maps a localhost browser origin to the Docker host IP, preserving CSP, and asserts the48px Cormorant computed font plus loaded fallback. With only the serif fix, delaying Inter produced form CLS0.005160346984863281 (form moved29.25px). With serif and sans fallbacks, both heading-first and body-first Linux runs report no shifts. Mac normal/delayed mobile/desktop cases also pass, asserting all four fallback faces loaded. No security header was weakened.

24 production screenshot cases passed for admin/sign-in and dev/theme in all themes at375/768/1280. Originals copied to docs/reviews/TICKET-012/font-fallback; four admin contact sheets were inspected (12 route/width states). Full-length showcase slices still need visual review before final UI signoff. No primary font or settled component styling changed. Current full-registry fallback changes need final full gate and final-head CI. Keep012 in_progress until those pass; prior full gate totals467unit/485browser are pre-repair evidence only.

Stack012 running with preserved synthetic data; temporary app server29692 should be stopped before final build. Official Linux image remains locally cached; temporary containers self-removed. Do not treat old pending CI on a prior head as final proof. All PR merges require final checks; release-only device QA201 remains open.

## 2026-10-31 — final local verification and showcase review

Head70ec28c full verification passed467 unit tests/22 opt-in skips and485 browser tests/129 conditional skips; format, lint, types and production build passed. Finished visual review of all four independently themed showcase sections at375/768/1280; layouts, typography, long-name wrapping, forms and QR remain intact. Retained original screenshots plus complete sectional contact sheets (quarters arranged left to right).

GitHub41198630938 failed before browser tests at the recurring Next font resolver error, not a new CLS measurement. Retried the failed job once; inspect that result and final-head CI before any merge. PR56 remains open and012 in_progress. No assertions or headers weakened. Next: mandatory t:pr gate, final-head CI, then authorized verified merge. If cold resolver repeats, keep the PR unmerged and address207 through its own claim/worktree. Base remains7191d981231d9fb71f101d308abc05fa4ec79501. Stack012 still running with retained synthetic data.
