# TICKET-185 retry-state review — 2026-11-04

Decision: **CHANGES REQUESTED / incomplete**. Screenshots and browser accessibility
pass; performance, cold-font layout shift, physical devices and the native document's
font-loading exception remain unresolved. No UI completion is claimed.

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

| Item                 | Result and evidence                                                                                                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Screenshots          | PASS — 24 captured and inspected; no clipping or crowded copy.                                                                                                                                           |
| Tokens               | PASS — registered colour/radius/font-role variables; no new palette or font files.                                                                                                                       |
| Restraint/typography | PASS for rendered states — one primary retry action, serif heading, 18px body, clear spacing.                                                                                                            |
| Mobile               | PASS at 375/768/1280 — no horizontal overflow; buttons at least 44px; guest retry near bottom on phones.                                                                                                 |
| Motion               | PASS — reduced-motion mode exercised; native document has no animation or script.                                                                                                                        |
| Keyboard             | PASS — visible focus, native form retry and PIN-to-submit tab sequence.                                                                                                                                  |
| Contrast             | PASS — Axe checks in all theme/width combinations, textual status guidance.                                                                                                                              |
| Load/images          | NOT VERIFIED — cold-font CLS unmeasured. Native response references existing local TTF assets with swap rather than next/font; resolve or obtain an explicit exception before approval. No images added. |
| Performance          | NOT VERIFIED — no Lighthouse result for the denial document.                                                                                                                                             |
| Copy                 | Provisional — warm generic retry text; long waits use minutes, while Retry-After keeps exact seconds. No credential or exception details.                                                                |
| Shared components    | Existing PIN form unchanged; native outage document cannot use the normal streamed page renderer while preserving the tested status. Review this exception before completion.                            |
| Sharing/devices      | NOT VERIFIED — no physical WhatsApp/iOS/Android check. Existing release gates remain mandatory.                                                                                                          |
| QR                   | N/A — no QR rendering changed; denial prevents download generation.                                                                                                                                      |
| Staff feedback       | PASS for tested lockout — existing pending/status region, readable text, immediate form response; no scan/haptic change.                                                                                 |
| Verification         | FAIL / pending — full gate stops at three migration-authorization hook tests; quick gate and dedicated browser/build checks are separate evidence.                                                       |

Next: resolve font/performance review, obtain pending exact-path migration and budget
approvals, rerun full verification and keep the PR draft until criteria are proved.
