# UI checklist

Run through this after a UI change, against [the design principles](design-principles.md). Note anything
you could not check in the PR.

- **Screenshots:** look at the changed page at 375px (and 768/1280px for guest pages) in at least two themes.
  `SCREENSHOT_ROUTES=/your-route pnpm screenshots`. Add the 375px shot to the PR.
- **Tokens:** no hard-coded colours, fonts, radii or shadows; use theme tokens and shared components.
- **Mobile:** no horizontal scroll; tap targets at least 44×44px; primary action within thumb reach.
- **Keyboard and contrast:** everything reachable by keyboard with visible focus; labelled fields; AA
  contrast; meaning never by colour alone.
- **Motion:** only opacity/transform, 150–300ms, and respect reduced motion.
- **Images:** `next/image` with `sizes` and reserved space, so nothing jumps on load.
- **Copy:** warm and short; no technical errors shown to guests.
- **Staff screens:** text at least 18px; green = done/valid, amber = waiting/used, red = problem.
