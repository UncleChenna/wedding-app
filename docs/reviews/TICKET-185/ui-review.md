# TICKET-185 retry-state review — 2026-11-04

Decision: **UI exception approved; ticket verification incomplete**. On 4 November
2026 the owner approved the native HTML response and existing local fonts, with
physical-phone checks retained as release requirements. Automated browser,
accessibility, cold-font and performance evidence passes. This is not a device-test
pass, migration approval, launch-budget approval, merge approval or release approval.

## Verified evidence

Production build passed. `e2e/request-budgets.spec.ts` passed five cases in 9.5s;
one duplicate mobile visual matrix was intentionally skipped because the desktop
matrix explicitly covers all three widths. Both mobile and desktop still run the
HTTP/privacy and cookie-reset scenarios. Twenty-four screenshots cover guest/PIN
states × four registered themes × 375/768/1280, under `screenshots/`; every image
was inspected. Axe reports no violations for these states.

The guest page uses a native HTML response with the original 429/503 status and
Retry-After header, without private URL interpolation. A GET form retries the current
URL without JavaScript. Keyboard retry after expiring the synthetic counter succeeds.
The first attempted Next page rewrite returned HTTP 200 in browser tests despite
its requested 429. It was removed; the status assertions were retained. No separate
public retry route remains. Downloads keep a small plain-text denial response.

The native document deliberately makes no database/theme fetch while handling an
outage; it uses the registered safe light/dark defaults. The visual matrix injects
the other registered tokens, as existing UI review helpers do. It does not prove
that the outage document uses an administrator's custom active pair.

## Checklist

| Item                 | Result and evidence                                                                                                                                                                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Screenshots          | PASS — 24 captured and inspected; no clipping or crowded copy.                                                                                                                                                                                                                  |
| Tokens               | PASS — registered colour/radius/font-role variables; no new palette or font files.                                                                                                                                                                                              |
| Restraint/typography | PASS for rendered states — one primary retry action, serif heading, 18px body, clear spacing.                                                                                                                                                                                   |
| Mobile               | PASS at 375/768/1280 — no horizontal overflow; buttons at least 44px; guest retry near bottom on phones.                                                                                                                                                                        |
| Motion               | PASS — reduced-motion mode exercised; native document has no animation or script.                                                                                                                                                                                               |
| Keyboard             | PASS — visible focus, native form retry and PIN-to-submit tab sequence.                                                                                                                                                                                                         |
| Contrast             | PASS — Axe checks in all theme/width combinations, textual status guidance.                                                                                                                                                                                                     |
| Load/images          | PASS for measured CLS — zero in all six default light/dark × width variants; see final measurements below. Native response references existing local TTF assets with swap rather than next/font; owner approved this native-font exception on 4 November 2026. No images added. |
| Performance          | PASS — three mobile production runs: Performance 100/100/100, Accessibility 100/100/100, CLS 0; see performance.json and methodology below.                                                                                                                                     |
| Copy                 | Provisional — warm generic retry text; long waits use minutes, while Retry-After keeps exact seconds. No credential or exception details.                                                                                                                                       |
| Shared components    | Existing PIN form unchanged; native outage document cannot use the normal streamed page renderer while preserving the tested status. Owner approved this exception on 4 November 2026.                                                                                          |
| Sharing/devices      | NOT VERIFIED — no physical WhatsApp/iOS/Android check. Owner approved deferral on 4 November 2026; existing release gates remain mandatory.                                                                                                                                     |
| QR                   | N/A — no QR rendering changed; denial prevents download generation.                                                                                                                                                                                                             |
| Staff feedback       | PASS for tested lockout — existing pending/status region, readable text, immediate form response; no scan/haptic change.                                                                                                                                                        |
| Verification         | FAIL / pending — full gate stops at three migration-authorization hook tests; quick gate and dedicated browser/build checks are separate evidence.                                                                                                                              |

Next: resolve font/performance review, obtain pending exact-path migration and budget
approvals, rerun full verification and keep the PR draft until criteria are proved.

## Cold-font regression

The new opt-in browser test delays local fonts by 500ms and requires exact-zero
CLS at 375, 768 and 1280px for both default colour schemes. All six assertions
failed. Baseline measurements:

| Scheme | 375          | 768          | 1280         |
| ------ | ------------ | ------------ | ------------ |
| Light  | 0.0220330954 | 0.0009761487 | 0.0004118127 |
| Dark   | 0.0016283236 | 0.0018658877 | 0.0007871714 |

Reserving heading/body heights and fixed button widths still produced nonzero
values (0.0004763082–0.0051484165), so that source experiment was reverted.
The regression test remains, with its exact-zero assertions unchanged. Existing
screenshots describe the restored source. No cold-font pass is claimed.

## Final cold-font correction

Source-rectangle diagnostics isolated heading wrapping and baseline changes during
font swaps. The retry document now reserves heading/body space, uses the existing
font registry's fallback metrics, and omits its redundant decorative label. The
heading, explanatory copy, native retry form and home link remain visible.

The exact-zero assertions now pass: light and dark each measure **0** at 375, 768
and 1280px with font requests delayed 500ms. No shifts are filtered beyond the
standard recent-user-input exclusion. The full retry suite passes six cases in
12.5s, with two duplicate matrix cases skipped in the mobile project. HTTP and PIN
checks still run in both browser projects. Twelve changed guest screenshots were
refreshed and inspected; twelve PIN screenshots are unchanged. Axe, keyboard,
overflow and target-size checks pass. Production build and quick verification
(lint, types, nine related unit tests) pass. Evidence: `artifacts/TICKET-185/metric-*.log`
and `retry-cold-fonts.json`. This does not certify other operating systems or the
remaining native-font-loader exception, performance, devices or full gate.

## Production performance measurement

Three serial Lighthouse **12.6.1** mobile runs of the real production denial route
`http://localhost:37411/i/synthetic-performance-link` scored Performance **100/100/100**
and Accessibility **100/100/100**. CLS was zero throughout; LCP was approximately
1.36 seconds. Machine-readable results: [performance.json](performance.json).

The synthetic local lookup counter was temporarily exhausted and restored exactly
after testing. Each run independently asserted HTTP 429 and `Cache-Control: no-store`.
Lighthouse's documented `--ignore-status-code` option allowed measurement of this
intentional error document; no response was changed to 200. The resulting HTTP 429
warning is retained in every result. This measures the retry document only, not
normal invitation/PIN pages, database throughput, or physical phones. Cached tooling
was used without dependency installation. The owned test server was stopped.

Reproduction script and full reports remain in `artifacts/TICKET-185/` as
`measure-retry-performance.mjs` and `lighthouse-retry-{1,2,3}.json`.

## Owner authorization — 4 November 2026

“Allow native retry page; retain device release checks.” This permits the native
HTML renderer and existing local fonts to preserve HTTP 429/503. Physical WhatsApp,
iOS and Android checks remain unverified release requirements in TICKET-201; this
exception does not remove them. Migration authorization, launch-budget approval
and full verification remain outstanding.
