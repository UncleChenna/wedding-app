---
id: WED-011
title: "Align theme files with the PRD: pattern texture and radius"
epic: design-system
status: todo
priority: urgent
estimate: M
labels: [design, frontend]
module: theming
owner: ""
agent: ""
blocked_by: [WED-009]
blocks: [WED-012, WED-013, WED-020, WED-046, WED-094, WED-170]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-011: Align theme files with the PRD: pattern texture and radius

## Context

The PRD's theme file has a `pattern` texture and a single radius; ours has neither the pattern nor a documented mapping.

See: [How theming works](../docs/prd.md#how-theming-works) (THM-1).

## Scope

- Optional `pattern` asset per theme, rendered as a subtle paper texture token.
- Document how PRD names (text, muted, onPrimary) map to our tokens.
- Regenerate the theme JSON schema with `pnpm themes:schema`.

## Out of scope

- Admin theme editor (WED-098).

## Acceptance criteria

- [ ] A theme with a pattern renders it on guest pages; one without renders a plain background.
- [ ] docs/theming.md contains the PRD-to-token mapping table.
- [ ] theme.schema.json is regenerated, not hand-edited.

- [ ] Pattern is optional and off by default; document scale, placement and strength rather than adding decorative grain everywhere. Keep one canonical schema with explicit PRD-name mappings.

## Test plan

- Unit: Schema accepts/rejects pattern paths.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Unit: missing pattern produces no texture; invalid paths and out-of-range strength fail.

## Files likely touched

- `src/modules/theming/lib/schema.ts`
- `src/modules/theming/themes/`
- `docs/theming.md`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
