# Staff/admin accessibility audit — TICKET-118

## Scope and method

Work in progress. The owned local stack supplies real staff PIN and admin email/TOTP authentication. The audit reads actual gate, kitchen, bar and nine admin routes at375px in all four registered themes with reduced motion. It records axe results, document overflow and computed visible-text sizes. Native keyboard submission and navigation are exercised. This is not a physical arm's-length or screen-reader certification.

## Baseline findings

- Staff/PIN and empty gate screens: no detected axe violation, overflow or visible text smaller than18px in the initial baseline.
- Kitchen/bar: the Staff label and order Note label render at14px in every theme, below the project's18px staff requirement. Axe detects no violation; these are project legibility findings, not a claim that WCAG imposes an18px minimum.
- Initial admin audit was interrupted by a synthetic fixed table-number collision after the failing staff test restarted its worker. The fixture now uses a unique number. No admin result is claimed yet.

Baseline evidence is preserved under `docs/reviews/TICKET-118/baseline/`. The in-progress runner is `pnpm exec tsx scripts/review-staff-accessibility.ts --build`; start this worktree's own local stack first.

## Outstanding

Complete actual admin and scanner-result states, bounded fixes and retests. Record physical device/browser/version for arm's-length reading, VoiceOver/TalkBack and actual software-keyboard checks under release QA. Do not infer these from desktop emulation or automated axe output.
