# TICKET-195 evidence — 26 October 2026

The helper now waits for finite animations after setting theme variables and loading fonts. Production styles are unchanged.

## Regression

`PW_SERVER=dev pnpm exec playwright test e2e/theme-transition.spec.ts --workers=1 --retries=0`: four failures before the fix (the old primary colour), then four passes after it. Tests check the actual offline retry button in both directions on mobile and desktop, reading computed background once immediately after applyTheme. Only the test fixture extends the existing transition to one second to expose the race reliably. The regression is included in the smoke gate.

## Screenshot inspection

`SCREENSHOT_ROUTES=/offline pnpm screenshots --workers=1`: six passes. All six attached images were inspected: correct dark gold in ivory and light champagne in midnight; text legible, button visible, no clipping or horizontal overflow. Captured from the development server using existing product transitions, without the regression fixture override.

| Theme    | 375px                               | 768px                               | 1280px                               |
| -------- | ----------------------------------- | ----------------------------------- | ------------------------------------ |
| Ivory    | [image](ivory-gold-375.png)         | [image](ivory-gold-768.png)         | [image](ivory-gold-1280.png)         |
| Midnight | [image](midnight-champagne-375.png) | [image](midnight-champagne-768.png) | [image](midnight-champagne-1280.png) |

## Scope and limitations

This changes test infrastructure only. No product components, tokens, layout, motion, copy, QR code or dependencies change. New Lighthouse, WhatsApp and physical-device checks are not applicable to this helper change; these screenshots are not a release-device certification. The existing animation helper excludes infinite animations and handles cancelled transitions. Full-gate results are recorded in the handoff.
