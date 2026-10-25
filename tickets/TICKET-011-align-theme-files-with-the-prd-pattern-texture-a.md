---
id: TICKET-011
title: "Align theme files with the PRD: pattern texture and radius"
epic: design-system
status: in_review
priority: urgent
estimate: M
labels: [design, frontend]
module: theming
owner: unclechenna
agent: claude
blocked_by: [TICKET-009]
blocks: [TICKET-012, TICKET-013, TICKET-020, TICKET-046, TICKET-094, TICKET-170]
branch: TICKET-011
pr: https://github.com/UncleChenna/wedding-app/pull/22
created: 2026-10-21
updated: 2026-10-25
started: 2026-10-25
completed: ""
reason: ""
resume_to: ""
---

# TICKET-011: Align theme files with the PRD: pattern texture and radius

## Context

The PRD's theme file has a `pattern` texture and a single radius; ours has neither the pattern nor a documented mapping.

See: [How theming works](../docs/prd.md#how-theming-works) (THM-1).

## Scope

- Optional `pattern` asset per theme, rendered as a subtle paper texture token.
- Document how PRD names (text, muted, onPrimary) map to our tokens.
- Regenerate the theme JSON schema with `pnpm themes:schema`.

## Out of scope

- Admin theme editor (TICKET-098).

## Acceptance criteria

- [x] A theme with a pattern renders it on guest pages; one without renders a plain background.
- [x] docs/theming.md contains the PRD-to-token mapping table.
- [x] theme.schema.json is regenerated, not hand-edited.

- [x] Pattern is optional and off by default; document scale, placement and strength rather than adding decorative grain everywhere. Keep one canonical schema with explicit PRD-name mappings.

## Test plan

- Unit: Schema accepts/rejects pattern paths.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Unit: missing pattern produces no texture; invalid paths and out-of-range strength fail.

## Files likely touched

- `src/modules/theming/lib/schema.ts`
- `src/modules/theming/themes/`
- `docs/theming.md`

## Notes / decisions

- 2026-10-25: Pattern = optional {src, strength, size}. src must be an SVG under the theme's own /themes/<id>/ (schema regex plus a whole-object refine); strength 0.02–0.12 so text contrast is protected; size 64–512px. The SVG is used as a CSS mask filled with the theme foreground, so it adds no colours. Off by default; Ivory & Gold ships a faint grain (0.05, 240px), Midnight & Champagne is plain.
- 2026-10-25: Rendering: <ThemePattern> (fixed, z-index -1, aria-hidden, pointer-events none) in the guest layout only; staff and admin stay plain (browser-tested). CSS variables --t-pattern-* are emitted only when a theme defines a pattern.
- 2026-10-25: theme.schema.json rebuilt only by pnpm themes:schema under the owner's standing approval for theme-schema writes in this run; approval file deleted after commit.
- 2026-10-25: Found and fixed: the screenshot harness overlaid a theme's variables without clearing the active theme's, so Ivory's pattern leaked into Midnight screenshots. It now removes --t-* variables before applying a theme.
- 2026-10-25: TICKET-010's hue test copied Ivory under a new id; it now drops the inherited pattern (the new own-folder rule is correct).
- 2026-10-25: Evidence: unit tests for optional/accepted/rejected patterns (external URL, other theme's folder, path escape, raster, strength and size out of range), CSS variable output, asset existence, and one patterned plus one plain theme; browser tests for the guest-page layer (mask URL, opacity, z-index, aria-hidden, asset served) and plain staff/admin pages. `pnpm verify` passed on develop 5725c80: 208 unit tests, build, 44 browser tests. Screenshots of / inspected in both themes.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-25 — todo → claimed — unclechenna (claude)
- 2026-10-25 — todo → in_progress — unclechenna (claude)
- 2026-10-25 — in_progress → in_review — unclechenna (claude)
