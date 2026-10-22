---
id: TICKET-010
title: Add fixed semantic status tokens for valid, used and invalid
epic: design-system
status: in_progress
priority: urgent
estimate: M
labels: [design, frontend]
module: theming
owner: unclechenna
agent: claude
blocked_by: [TICKET-009]
blocks: [TICKET-013, TICKET-017, TICKET-019, TICKET-022]
branch: TICKET-010
pr: ""
created: 2026-10-21
updated: 2026-10-22
started: 2026-10-22
completed: ""
reason: ""
resume_to: ""
---

# TICKET-010: Add fixed semantic status tokens for valid, used and invalid

## Context

Staff screens need green/amber/red with the same meaning in every theme. There is no warning/amber token today.

See: [How theming works](../docs/prd.md#how-theming-works) (THM-4) · [Design principles (repo)](../docs/design-principles.md).

## Scope

- Add `success`, `warning`, `danger` (+ foreground and subtle variants) as shared semantic tokens with stable hues.
- Contrast gate covers every status pair in every theme.
- Document the tokens in docs/theming.md and show them on /dev/theme.

## Out of scope

- Staff result components (TICKET-019).

## Acceptance criteria

- [x] Every theme defines the status tokens and passes AA for each status foreground/background pair.
- [x] Hues stay within a documented range across themes (green, amber, red).
- [x] /dev/theme shows the three statuses with text labels in both themes.

## Test plan

- Unit: Contrast and hue-range tests.
- End-to-end: Smoke `/dev/theme` asserts the status swatches render.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/theming/lib/schema.ts`
- `src/modules/theming/themes/*.json`
- `src/app/globals.css`
- `docs/theming.md`

## Notes / decisions

- 2026-10-22: Tokens: added `warning`, `warning-foreground` and `<status>-subtle` / `<status>-subtle-foreground` for success, warning and danger (12 status tokens). Both themes define them; the low-contrast test fixture too.
- 2026-10-22: Contrast: 10 new pairs in `CONTRAST_PAIRS` (fg on solid, subtle-fg on subtle and on surface at 4.5; solid on surface at 3.0 as an indicator). Both themes pass. Light theme amber is `#946000` because bright ambers cannot reach 3:1 on a white card; the tinted `#FCEFC7` panel carries the bright amber look.
- 2026-10-22: Hue: `src/modules/theming/lib/status.ts` documents green 90–170°, amber 25–60°, red 345–15° (wraps) and saturation ≥ 30%, checked on each solid colour and its subtle-foreground. `loadTheme` rejects violations, naming the token and expected family (unit-tested with a blue success and a grey warning).
- 2026-10-22: Schema: `theme.schema.json` rebuilt only by `pnpm themes:schema` under an owner-approved exact-path write (`.harness/approved-writes.json`, expires 2026-10-22 18:00 UTC).
- 2026-10-22: Evidence: `pnpm verify` passed on base develop 15533a1 (190 tickets valid, 140 unit tests, build, 27 browser tests incl. the new status assertions in both themes). Screenshots of /dev/theme at 375/768/1280 in ivory-gold and midnight-champagne inspected.
- 2026-10-22: Found, not fixed (out of scope): `scripts/harness/commit-rules.mjs` flags "regenerated with" as AI attribution because `/generated (with|by)/` lacks a leading word boundary.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-22 — todo → claimed — unclechenna (claude)
- 2026-10-22 — todo → in_progress — unclechenna (claude)
- 2026-10-22 — in_progress → blocked — unclechenna (claude) — Needs human exact-path approval (.harness/approved-writes.json) to regenerate protected src/modules/theming/themes/theme.schema.json via pnpm themes:schema; implementation is complete locally but uncommitted
- 2026-10-22 — blocked → in_progress — unclechenna (claude)
