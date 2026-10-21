# 0004 — Themes as JSON → CSS variables → Tailwind tokens

- Status: Accepted · 2026-10-21

**Context.** The couple wants plug-and-play colour themes and a premium look; the page must never flash the wrong theme; text must stay accessible.

**Decision.** Each theme is a JSON file (colours as hex, font keys, radii, shadows) validated by Zod and a WCAG AA contrast check at module load. The root layout renders the theme as CSS custom properties (`--t-*`) on `<html>` on the server. Tailwind 4 `@theme inline` maps utilities to those variables; the default palette is removed and ESLint bans colour literals in `src/`. The active theme is one constant in `src/modules/theming/config.ts`.

**Consequences.** Switching themes is a one-line change and restyles everything. Adding a theme is a JSON file plus one import (see `docs/theming.md`). Fonts must be registered in `theming/components/fonts.ts` (next/font needs static calls). A runtime theme switcher (from the `themes` table) can be added later by changing where the layout gets the theme.
