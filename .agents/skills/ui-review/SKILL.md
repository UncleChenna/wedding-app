---
name: ui-review
description: Use when changing or reviewing UI, styling, components, or themes; verify the wedding design rules with evidence.
---

# Ui Review

1. Read `AGENTS.md`, `docs/design-principles.md`, `docs/ui-checklist.md`, and `docs/theming.md` from the repository root.
2. Identify affected routes; include `/dev/theme` for component or token changes.
3. Run `SCREENSHOT_ROUTES=/route,/dev/theme pnpm screenshots`. Capture 375, 768, and 1280px in every registered theme (at least two).
4. Inspect every screenshot and long-page slice; exercise keyboard, focus, reduced motion, and relevant states using Playwright.
5. Run the remaining device, preview, contrast, performance, and QR checks in the canonical checklist. Report unavailable checks as not verified.
6. Report PASS/FAIL/N/A with evidence per checklist item, ranked findings, and APPROVE or CHANGES REQUESTED. Never approve unverified required checks. Review-only requests do not authorize source edits.
