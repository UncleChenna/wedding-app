# TICKET-015 typography review

26 October 2026. APPROVE for the typography scale and component preview. This does not certify guest-release performance or physical devices.

| Checklist item       | Result and evidence                                                                                                                                                                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Screenshots          | PASS: repository screenshot suite six passes for /dev/theme at 375/768/1280 and both registered themes. All six detailed typography specimens in screenshots/ inspected. Names, headings, paragraphs and staff text wrap without clipping.                                           |
| Tokens               | PASS: font roles use scoped theme tokens, no new typeface or colour introduced. The optional script token resets to the current theme's display font. Generated schema came from the original approved generator commit; this resumption does not change schema or lockfile.         |
| Restraint/typography | PASS: nine named styles and intended uses; computed heading sizes ≥32/48 at 375/1280, body ≥16 and line-height 1.5–1.7, labels 0.12em, staff text ≥18 and identifiers ≥32. All nine rendered font roles checked in both themes.                                                      |
| Mobile               | PASS: existing overflow tests and six screenshot cases pass. New content is static text; no new tap targets or keyboard-obscuring overlays.                                                                                                                                          |
| Motion               | PASS: no new motion; specimen captures use reduced motion and existing motion tests remain intact.                                                                                                                                                                                   |
| Keyboard             | N/A for new static type specimens; no interactive behavior added. Existing keyboard smoke coverage retained.                                                                                                                                                                         |
| Contrast             | PASS: theming contrast tests, rendered axe checks, Lighthouse Accessibility 100 mobile and desktop.                                                                                                                                                                                  |
| Load/images          | PASS for required typography CLS: Lighthouse 13.5.0 reports numeric CLS exactly 0 on /dev/theme for mobile and desktop; Playwright Layout Instability assertions also pass. No images or new font files added. Existing next/font swap and fallback metrics retained.                |
| Performance          | Measured mobile 85, desktop 100 on /dev/theme. The guest-page ≥95 release target is not claimed for this component catalog. Existing approval to merge previews with remaining release QA in TICKET-201 applies; do not interpret these measurements as guest-release certification. |
| Copy                 | PASS: style uses documented; couple-name sample uses Uchenna & Adaora. Other specimen examples reuse PRD copy. The user chose Warm for subsequent invitation-copy work.                                                                                                              |
| Shared components    | PASS: named Tailwind utilities and specimen in every theme. No one-off visual component introduced.                                                                                                                                                                                  |
| Sharing/devices      | No guest route, share metadata or live flow changed. Physical device/WhatsApp release checks remain unverified in TICKET-201.                                                                                                                                                        |
| QR                   | N/A: no QR changes.                                                                                                                                                                                                                                                                  |
| Staff feedback       | PASS for typography and fixed status meaning tests. Sound/vibration N/A for static type styles.                                                                                                                                                                                      |
| Verification         | Quick/full gate passed: 259 unit tests; 162 browser passes plus one invitation test passing on retry; 17 conditional skips. That invitation case also passed alone with retries disabled (16.6s). The PR workflow repeats the full gate.                                             |

## Regression evidence

A new unit assertion failed when the optional script token was omitted. A real browser assertion reproduced inherited Inter instead of Cormorant for the ivory theme's script style. The fix resets the script token for every theme and has named text utilities read scoped --t-font-* values instead of inherited outer aliases. All 47 theming unit tests and the focused browser regression then passed. Size, tracking, line-height, contrast and CLS assertions were preserved.

## Audit reproduction

Serve the production build on the managed port (22350), set CHROME_PATH to Playwright's installed Chromium executable, then run:

```sh
pnpm dlx lighthouse@13.5.0 http://localhost:22350/dev/theme --chrome-flags=--headless --only-categories=performance,accessibility --output=json --output-path=artifacts/lighthouse/typography-mobile.json --quiet
# Repeat with --preset=desktop for the desktop report.
```

lighthouse-mobile.json and lighthouse-desktop.json here are programmatically extracted report metadata, category scores and core metric audits from those raw reports. The complete raw reports stay in artifacts/lighthouse/. No project dependency or lockfile change was needed.
