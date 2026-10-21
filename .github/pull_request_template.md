# Ticket

Ticket: TICKET-NNN <!-- required; the PR title must also start with the ticket id -->

# Summary

<!-- Problem, resulting behaviour, and validation. -->

# Screenshots

<!-- Required for UI changes: affected routes at 375/768/1280 in every theme (at least two). For non-UI work explain N/A. -->

# UI checklist

<!-- Generated from docs/ui-checklist.md by pnpm agents:link. Record evidence or justified N/A. -->

- [ ] **Screenshots:** Playwright screenshots of affected routes at 375px, 768px, and 1280px in every registered theme (at least two). Record paths and inspect them; use `SCREENSHOT_ROUTES=/affected-route pnpm screenshots`.
- [ ] **Tokens:** Search changed files for hard-coded colours, font families, radii, and shadows. Components use theme tokens; any new token is defined through the documented theming process.
- [ ] **Restraint and typography:** One main idea per section, restrained palette and decoration, required spacing, font roles, body size, line height, and prose width.
- [ ] **Mobile:** No horizontal page scroll at review or intermediate widths; all tap targets at least 44×44px; primary actions reachable and safe-area/keyboard handling checked.
- [ ] **Motion:** Reduced-motion mode checked; only opacity/transform animated; durations within limits; no blocking animation.
- [ ] **Keyboard:** All actions reachable and operable, focus visible, fields labelled, and dialog focus/escape/return behaviour works.
- [ ] **Contrast:** AA contrast passes in every theme, including actual rendered states. Meaning never depends on colour alone.
- [ ] **Load and images:** CLS = 0 on load; image space reserved; photographs use `next/image`, accurate `sizes`, AVIF/WebP, blur placeholders, and appropriate alt text; fonts use `next/font` with swap and stable fallback metrics.
- [ ] **Performance:** Affected guest pages score at least 95 for Performance and Accessibility in Lighthouse mobile on a production build. Record scores and routes; client boundaries remain minimal.
- [ ] **Copy:** Warm, concise, human wording; approved PRD copy reused where present; no technical errors exposed to guests.
- [ ] **Shared components:** Existing shared components reused; any new reusable pattern added to `/dev/theme`.
- [ ] **Sharing and devices:** Guest-page Open Graph previews checked in WhatsApp; affected guest flows tested in WhatsApp's iOS and Android in-app browsers. Record devices and results.
- [ ] **QR codes:** Contrast and four-module quiet zone preserved; scan tested on iOS and Android when QR output changes.
- [ ] **Staff feedback:** Staff typography and fixed status meanings checked in all themes; actions provide immediate visual feedback; successful scans request supported sound/vibration and tolerate unavailable feedback APIs.
- [ ] **Verification:** `pnpm verify` passes. Record the result.

# Harness changes, if any

<!-- Hooks, skills, docs, or repeated-mistake fixes. -->
