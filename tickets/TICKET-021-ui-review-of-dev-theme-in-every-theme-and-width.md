---
id: TICKET-021
title: UI review of /dev/theme in every theme and width
epic: design-system
status: in_progress
priority: urgent
estimate: S
labels: [design, test]
module: theming
owner: unclechenna
agent: claude
blocked_by: [TICKET-015, TICKET-016, TICKET-018, TICKET-019, TICKET-020, TICKET-013]
blocks: [TICKET-037]
branch: TICKET-021
pr: ""
created: 2026-10-21
updated: 2026-10-27
started: 2026-10-27
completed: ""
reason: ""
resume_to: ""
---

# TICKET-021: UI review of /dev/theme in every theme and width

## Context

Migrated from SETUP-005: the component library needs a full UI checklist pass before features build on it.

See: [What "flawless" means in testing](../docs/prd.md#what-flawless-means-in-testing) · [Design principles (repo)](../docs/design-principles.md).

## Scope

- Run the ui-review skill on `/` and `/dev/theme` at 375/768/1280 in every theme.
- Fix blockers and should-fix findings.

## Out of scope

- Feature pages.

## Acceptance criteria

- [x] Every UI checklist item has PASS/FAIL/N/A evidence in notes.
- [x] No blocker remains; deferred should-fix items are listed with reasons.

- [x] Review every preset and all base components at 375/768/1280, recording AA pairs, 44px targets, visible focus and long-name wrapping.

## Test plan

- End-to-end: `SCREENSHOT_ROUTES=/,/dev/theme pnpm screenshots`.
- Manual: Inspect screenshots; keyboard and reduced-motion pass.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Manual: evidence checklist must include all themes; unresolved AA failures prevent sign-off.

## Files likely touched

- `src/modules/shared/components/ui/`
- `src/modules/theming/`

## Notes / decisions

- 2026-10-21: Migrated from `docs/tasks.json` SETUP-005.
- 2026-10-27 — Reviewed `/` and `/dev/theme` in all four presets (Ivory & Gold, Midnight & Champagne, Emerald Night, Blush & Sage) at 375/768/1280.
- 2026-10-27 — **Findings fixed (blockers):**
  1. Focus rings on `Button` were invisible for 150ms in every theme: `transition-colors` animated `outline-color` from the label colour (e.g. white on ivory, 1.07:1). The transition is now limited to `color`, `background-color` and `border-color`, so the `ring` outline appears immediately.
  2. A long single-word guest name stretched the staff panel grid to 406px at 375px (page scrolled sideways). `StatusPanel` names now use `overflow-wrap: anywhere`, which also lowers the min-content width.
  New regression spec `e2e/theme-review.spec.ts` covers both in every theme; it failed before the fixes and passes after.
- 2026-10-27 — **UI checklist:**
  - Screenshots — PASS: `SCREENSHOT_ROUTES=/,/dev/theme pnpm screenshots`, 24 passed, `artifacts/screenshots/<theme>/<width>/`; slices inspected per theme.
  - Tokens — PASS: changes are class-only; lint rule against literal colours passes.
  - Restraint and typography — PASS: typography spec passes in every theme at 375 and 1280.
  - Mobile — PASS: no sideways scroll at 375 after fix 2 (theme-review and overflow specs); every control ≥44×44 (a11y spec over all four stacked themes).
  - Motion — PASS: motion spec passes, including reduced motion; fix 1 removes the one non-opacity/transform transition found on focus.
  - Keyboard — PASS: every Tab stop in each theme shows a ≥2px outline at ≥3:1 against the page; Sheet traps focus, Escape closes, focus returns (a11y spec, all themes).
  - Contrast — PASS: theme contrast gate for every token pair in all four themes; axe passes on `/dev/theme`.
  - Load and images — PASS: CLS 0 on `/dev/theme` (typography spec); no photographs on these routes.
  - Performance — NOT VERIFIED: Lighthouse not run (`/dev/theme` is not a guest page; `/` covered by TICKET-116).
  - Copy — PASS: no copy changes except the long-name sample on a dev page.
  - Shared components — PASS: fixes are in shared `Button` and `StatusPanel`, shown on `/dev/theme`.
  - Sharing and devices — NOT VERIFIED: no real devices (TICKET-201/TICKET-138).
  - QR codes — PASS: QR decodes from painted pixels in every theme (qr-code spec); real-camera scans not verified.
  - Staff feedback — PASS: staff panel sizes (≥18px text, ≥32px identifier) and status meanings checked in every theme (a11y spec).
  - Verification — PASS: `pnpm verify` via `t:pr`.
- 2026-10-27 — **Deferred should-fix:**
  - Disabled and loading buttons use 50% opacity, so "Saving…" can drop below 4.5:1 (e.g. Blush & Sage). WCAG exempts inactive controls; revisit when the RSVP and ordering flows show loading states (TICKET-040/TICKET-072).
  - Very long single-word names break mid-word on phones. This is better than overflow; automatic hyphenation was rejected because it mis-hyphenates non-English names.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-27 — todo → claimed — unclechenna (claude)
- 2026-10-27 — todo → in_progress — unclechenna (claude)
