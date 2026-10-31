# TICKET-037 handoff

## 2026-10-31 — divine / codex

Branch/worktree TICKET-037; base7191d981231d9fb71f101d308abc05fa4ec79501. Claimed and moved in_progress through CLI, pushed06fbe57. No product code changed yet. Plan in docs/plans/2026-10-31-TICKET-037.md. All criteria remain unticked.

Managed setup initially failed because the old primary-checkout generator omitted supabase/templates/admin-code.html. The merged generator already copies templates; running AGENT_OWNER=divine pnpm wt:new TICKET-037 from this current worktree completed setup and migration without manual generated-file edits. Stack wedding-919f78c6afdf running; app25590, browser25591, database25581. No server started and no seed yet. TICKET-012 stack stopped with backup=true; other stacks untouched.

Next: read installed Next docs and036/040 handoffs, resolve the pass-navigation prerequisite described in the plan, then write failing UI tests and implement the invitation detail layout. Use approved names/date and explicit TBD event fields. No dead pass or map URLs. Verify screenshots, accessibility, keyboard, reduced motion, performance and full gate. Physical-device QA remains unverified. Do not report this draft as a delivered frontend change.

TICKET-012 PR56 is in_review at239e1b6; full local467unit/485browser pass; final GitHub CI41199576369 pending. PR55 merged7191d981;201 still blocks both releases. Latest user explicitly approved PR55 merging after CI. Follow current user merge authorization and repository rules for subsequent PRs; never merge failing checks.

Draft PR: https://github.com/UncleChenna/wedding-app/pull/57. Planning checkpoint716f06b pushed; no product implementation yet. CLI has no draft-PR metadata command; t:pr records the link on the verified in_review transition.

## 2026-10-31 — invitation layout implemented

Pushede709df2 adds InvitationLetter, event-settings projection into the personal route, safe configured maps, date-only formatting independent of visitor timezone, a reply anchor, optional actual-pass content section, and /dev/invitation/letter linked from/dev. No new client boundary. Pending details stay TBD. Original photo preview is unchanged.

Four component tests first failed on absent implementation, then passed. Production build and quick gate pass. Thirteen preview browser cases pass; all12 theme/width captures inspected. Six real RSVP checks pass (yes/no persistence with/without JS, tampering/revocation). Two new isolated database/no-JS tests verify configured details and80-character couple/guest names at375; e2e/invitation-details-live.spec.ts is the ticket-owned test.

Automatic approval review rejected changes to existing RSVP tests as cross-ticket scope. User then explicitly approved ONLY e2e/rsvp-review.spec.ts keyboard navigation and alternate screenshot folder. Apply that narrow change after the running full gate completes; no permission needed again. Existing e2e/rsvp-live.spec.ts remains untouched. New independent test was used for additional coverage.

Full gate running in session68844; artifacts/TICKET-037/full-verification.log. Do not restart merely because observation times out. Next: approved visual-test adjustment, run RUN_RSVP_REVIEW=1 with RSVP_REVIEW_DIR=docs/reviews/TICKET-037/live, inspect all actual states, measure production Lighthouse/CLS and finish checklist. Scope discrepancy with actual pass044 remains unresolved; no pass criterion ticked and no fake link added. Keep037 in_progress/draft57.

TICKET-012 final CI41199576369 passed and PR56 merged as5bd56a82d37942a1a046fc1b1c93c22f2a6829bc; CLI done, bookkeeping65df63e pushed.037 still based on7191d981 and needs final integration/CI assessment.012 stack stopped with backup preserved.037 stack running with synthetic RSVP browser fixture only. No real guest data. Avoid /dev/null redirection: hook treats it as an outside-checkout write; logs belong under artifacts/TICKET-037.

## 2026-10-31 — review results and next correction

Full gate finished:459 unit tests/21 opt-in skips;505 browser passes/129 skips, but TWO failures because the new preview route was missing from the central accessibility route registry. Added /dev/invitation/letter to e2e/support/routes.ts; rerun still needed. No assertion weakened.

Applied the explicitly approved e2e/rsvp-review.spec.ts update. All12 live visual cases passed, yielding60 captures under docs/reviews/TICKET-037/live; those60 still need manual inspection. Preview12 already inspected. Three production Lighthouse real-invitation runs scored99/100/100 Performance,100 Accessibility; CLS0.008045178049238436/0/0. First-load shift FAILS strict zero and must be investigated/retested after integrating the now-merged012 font fallback repair. Temporary server25592 stopped.

Proposed retaining real returning-pass integration in044 and layout/anchor in037. Automatic approval review rejected edits to both ticket definitions as cross-ticket scope; exact split approval is pending. Neither ticket definition changed. Do not treat silence as approval. Other work can continue.

Next: checkpoint/push, integrate verified origin/develop5bd56a82d37942a1a046fc1b1c93c22f2a6829bc (012), remeasure cold-load CLS and rerun full gate after route-registry correction, inspect live captures, then resolve pending scope decision and final review/CI. TICKET-037 remains draft and incomplete.

## 2026-10-31 — owner approvals applied and layout stability corrected

Owner explicitly approved the TICKET-037/044 requirement split and the three unchanged migration paths plus their local authorization record. Both ticket definitions now retain the requirement in the correct scope. Migration files were integrated unchanged from develop5bd56a82 in pushed415f0ba; no new migration authored. No authorization remains pending for these actions.

The merged font fallback alone still produced CLS0.008045/0.006245/0.008045. Deliberate headline sentence lines reduced it to0.0001367; left-aligning letter greeting/subline produced CLS0 in all three measured cold loads. Final Lighthouse Performance90/95/98 and Accessibility100/100/100: performance is not yet a blanket pass. Preserve all metric files. No test threshold or assertion weakened.

Four component tests, quick verification and25 targeted browser cases pass. Refreshed12 previews and60 live-state screenshots are all visually inspected via full-page contact sheets; original PNGs retained. Full gate running in session31226, log artifacts/TICKET-037/final-verification.log. Temporary performance server25592 stopped. Managed synthetic database remains running; other stacks untouched.

Next: collect full gate result, investigate the variable performance result without selecting only favourable runs, check intermediate widths and retain physical device/map limitations. Update PR57 with final evidence and push scoped changes. Latest supplied AGENTS.md requires human merging; do not merge automatically. This ticket remains incomplete until outstanding checks are resolved.
