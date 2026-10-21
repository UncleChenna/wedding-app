---
name: new-theme
description: Use when adding or modifying a colour theme or its tokens; validate contrast and preview every component.
---

# New Theme

1. Read `docs/theming.md` and `docs/design-principles.md`; use the documented copy/edit/register procedure.
2. Add or update the theme JSON and its registry import. Keep token definitions canonical; regenerate the theme schema only when its Zod source changes.
3. Run `pnpm test src/modules/theming`; fix every reported contrast pair. Do not lower thresholds.
4. Preview `/dev/theme` and follow the `ui-review` skill at 375/768/1280 in every theme.
5. Run `pnpm verify`, document new tokens in `docs/theming.md`, and record checklist evidence in the handoff.
