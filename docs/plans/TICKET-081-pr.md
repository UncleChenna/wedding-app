## Summary

A fresh `/order` visit originally transferred about 1.24 MB, including service-worker installation. The order page now uses a small themed HTML document with progressive enhancement and reuses the existing order submission, retry, validation, availability and status contracts. The original 200,000-byte budget remains unchanged.

The final production build transfers 159,051–181,961 bytes across light/dark, mobile/desktop and table/menu cases. The menu fixture includes `Ọgbọnọ · Crème brûlée`. Real Supabase broadcast delivery under emulated slow 4G took 378.475 ms, below 2 seconds, with one persisted quantity and the matching broadcast observed before the board displayed it.

## Acceptance criteria and evidence

- [x] Cold `/order` transfer ≤200,000 bytes: all eight light/dark, mobile/desktop table/menu cases pass; maximum 181,961 bytes including worker/font traffic. CI gate added.
- [x] Order-to-board <2s on emulated slow 4G: actual Supabase broadcast and persisted order proof measured 378.475 ms. CI gate added.

## Changes

- Native GET and POST/redirect/GET preserve no-JavaScript table selection, same-origin checks, bounded streamed forms and the scoped HttpOnly session cookie. Unexpected page failures return a safe themed HTTP 503.
- The small browser bundle imports existing submission/idempotency and polling contracts; strict response contracts use named Zod Mini imports. Guest quantity controls, notes, availability, retries, received/served groups and accessibility remain covered by existing journeys.
- Generated, licensed font subsets retain original variable axes and exact rendering. Latin-1 and Igbo glyphs have dedicated subsets; other characters retain full-font fallback.
- Public worker responses negotiate gzip with identity fallback, `Vary: Accept-Encoding`, unchanged scope and no-store update semantics. No request is hidden or delayed to meet the budget.
- CI runs complete cold-wire budget/font checks and an actual Supabase slow-4G delivery check. The passive wire proxy counts response headers, chunk framing, worker bytes and fonts, including bytes Chromium's worker accounting omits.

## Verification

- Production build and `pnpm verify:quick`: pass, including lint, types, related tests and CI parity.
- Final cold-wire browser tests: 8/8 pass. Exact per-case totals and request breakdowns: `docs/reviews/TICKET-081/native-wire-{mobile,desktop}-{light,dark}-{table,menu}.json`.
- Font browser parity: 48 comparisons per viewport across four families, weights 400/500/600, common punctuation, Latin-1, Igbo and full-font fallback; mobile and desktop pass. Hash/coverage/axis checks pass.
- Worker compression and existing service-worker regressions plus font metadata: 45 tests pass. Round-trip decompression equals the complete original script; explicit gzip refusal and identity response are tested.
- Actual slow-4G delivery: `docs/reviews/TICKET-081/delivery.json` (150 ms latency, 1.6 Mbps down, 750 Kbps up).
- Native form/security tests cover body stream limits, origin rejection, cookie preservation, escaping and safe error recovery. Existing ordering contract tests pass.
- Existing guest journey screenshots: `docs/reviews/TICKET-081/parity/`; all 11 existing guest journeys pass across the final run and focused retries (8 initial passes, then availability/cooldown passes and the status pass with its required ephemeral staff secret). The initial run was interrupted by wall-clock jumps; the missing-secret status attempt was an environment failure, not counted as a pass.

## Risks and rollout

This is a deliberate native-rendering exception documented in ADR 0027. Shared business rules remain authoritative, but the DOM adapter must stay aligned with shared controls. Physical phones, venue signal and fresh Lighthouse/CLS checks are not certified here; existing release gates remain mandatory. Large menus or additional Unicode fallback fonts can increase transfer beyond the measured synthetic menu. This does not promise an arbitrary amount of content fits 200 KB.

Review `/order` with JavaScript disabled for table selection, then enabled for quantity controls, notes, submit/retry, sold-out and received/served states. Inspect the all-theme screenshots and the exact wire artifacts. CI results and independent review must be clean before merging.

## Rollback

No database migration or production data change. Restore the previous `/order/page.tsx` renderer and asset build command if necessary; retain immutable old assets for already-open documents. Font generation is reproducible via the pinned generator and manifest hashes.

## UI checklist disposition

| Item                | Result and evidence                                                                                                                                                                                                                 |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Screenshots         | All four themes at 375/768/1280 in `docs/reviews/TICKET-081/parity`; existing journey suite captures menu, table, retry and receipt states. Representative mobile menu inspected. Full independent visual review remains requested. |
| Tokens              | PASS: document uses validated theme CSS; controls use token colors/radii/spacing. No literal color values in the new ordering stylesheet.                                                                                           |
| Typography          | PASS: original approved font families, variable axes and exact browser pixel/width parity; complementary fallback ranges preserved.                                                                                                 |
| Mobile              | Existing journey assertions check overflow and 44px controls across review widths; sticky action bar includes safe-area padding. Physical keyboard behavior remains unverified.                                                     |
| Motion              | N/A: native ordering adapter has no transitions or animations.                                                                                                                                                                      |
| Keyboard            | Native labels/forms and quantity keyboard controls preserved; table/error/receipt focus checked by existing journeys. No dialog introduced.                                                                                         |
| Contrast            | All-theme axe assertions in existing journey suite; no color-only sold-out/status meaning.                                                                                                                                          |
| Load/images         | No photographs on this route. Font metric fallbacks preserved; fresh exact-zero CLS not certified. Native font generation is the documented ADR0027 exception to next/font.                                                         |
| Performance         | PASS for ticket budget and actual slow-4G delivery; fresh Lighthouse95 remains unverified and retained as release work.                                                                                                             |
| Copy                | Existing approved ordering copy and human recovery text reused.                                                                                                                                                                     |
| Shared components   | ADR0027 approved native-rendering exception; shared contracts, retry/idempotency, validation and grouping remain source of truth.                                                                                                   |
| Sharing/devices     | OG metadata retained; WhatsApp preview and physical iOS/Android checks remain unverified release gates.                                                                                                                             |
| QR / staff feedback | N/A: no QR or staff interface changes. Actual guest-to-staff delivery independently measured.                                                                                                                                       |
| Verification        | Targeted quick verification and production build pass. CI scope checks and independent review required before merge. Full release verification remains required separately.                                                         |

## Integrated base verification

Verified against develop `b2ade840ff38f109723841ce35e760a166727a22`, including the worker update guard. The sole merge conflict was adjacent imports; both were retained. Production build passes, quick verification passes (344 related tests, 9 opt-in skips, plus 2 CI-parity tests), and all eight complete cold-wire cases pass at the totals above. Exact post-integration measurements replace the earlier per-case artifacts.

Final integration also verifies develop `63fcd2729ee6277adcfc89de17f1543a70acef8e` (TICKET-184): quick verification passes 97 related tests plus 2 CI-parity tests; production build passes; all 22 combined wire/PWA cases pass. Strict queue-identity cache/key/UUID assertions and hashed offline-font allowlisting are both retained. These are the final per-case wire artifacts.
