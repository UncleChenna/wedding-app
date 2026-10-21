# Theming

Themes are JSON files. The server turns the active theme into CSS variables on `<html>`; Tailwind classes read those variables. Every theme must pass WCAG AA contrast or the tests and build fail.

## Switch the active theme (10 seconds)

Edit one line in `src/modules/theming/config.ts`:

```ts
export const ACTIVE_THEME_ID = "midnight-champagne";
```

Every page restyles. No component changes.

## Add a new theme (under 5 minutes)

1. **Copy** an existing theme: `cp src/modules/theming/themes/ivory-gold.json src/modules/theming/themes/sage-garden.json`
2. **Edit** the copy: set `"id": "sage-garden"` (must match the file name), `"name"`, `"colorScheme"` (`light` | `dark`), then the colours (6-digit hex), fonts, radii and shadows. Your editor autocompletes and validates via `theme.schema.json`.
3. **Register** it in `src/modules/theming/themes/index.ts`:
   ```ts
   import sageGarden from "./sage-garden.json" with { type: "json" };
   export const themes = [ivoryGold, midnightChampagne, sageGarden].map(loadTheme);
   ```
4. **Check**: `pnpm test src/modules/theming`. If a colour pair fails contrast you get a message like
   `Theme "sage-garden" fails WCAG AA contrast: - muted-foreground on background: 3.80:1 (needs 4.5:1, secondary text on page)`.
   Darken/lighten the named token and re-run.
5. **Look**: `pnpm dev` → http://localhost:3000/dev/theme shows every component in every theme. For phone/tablet/desktop screenshots: `pnpm screenshots`.

## Colour tokens

| Token                                | Used for                                      | Must contrast with (AA)                                    |
| ------------------------------------ | --------------------------------------------- | ---------------------------------------------------------- |
| `background`                         | Page                                          | —                                                          |
| `foreground`                         | Body text                                     | background, surface, surface-muted (4.5)                   |
| `surface` / `surface-muted`          | Cards, sheets / muted panels, disabled inputs | —                                                          |
| `muted-foreground`                   | Secondary text, hints                         | background, surface (4.5)                                  |
| `primary` / `primary-foreground`     | Main buttons, links / text on primary         | primary on background & surface (4.5); fg on primary (4.5) |
| `secondary` / `secondary-foreground` | Secondary buttons                             | 4.5                                                        |
| `accent` / `accent-foreground`       | Highlights                                    | 4.5                                                        |
| `border`                             | Decorative dividers                           | —                                                          |
| `input`                              | Form field borders                            | surface (3.0, non-text)                                    |
| `ring`                               | Focus outline                                 | background, surface (3.0)                                  |
| `danger` / `danger-foreground`       | Errors, destructive                           | danger on surface (4.5); fg on danger (4.5)                |
| `success` / `success-foreground`     | Confirmations                                 | 4.5                                                        |

The full list of checked pairs is `CONTRAST_PAIRS` in `src/modules/theming/lib/contrast.ts`.

Tailwind classes: `bg-<token>`, `text-<token>`, `border-<token>`, `outline-<token>`, with opacity (`bg-primary/90`). Also `font-display`, `font-sans`, `rounded-{sm,md,lg}`, `shadow-{sm,md,lg}`.

## Fonts

Themes pick fonts by key: `cormorant`, `playfair`, `inter`, `jost`. To add a font, load it with `next/font/google` in `src/modules/theming/components/fonts.ts` (variable `--font-<key>`), add the key to `FONT_KEYS` in `lib/schema.ts`, then run `pnpm themes:schema`.

## Adding a new token

1. Add it to `COLOR_TOKENS` in `lib/schema.ts` (and a contrast pair in `lib/contrast.ts` if it carries text).
2. Add it to every theme JSON.
3. Map it in `src/app/globals.css`: `--color-<token>: var(--t-color-<token>);`
4. `pnpm themes:schema && pnpm test`.

## Rules

- Never hard-code a colour in `src/` (hex, rgb, hsl, oklch). ESLint fails the build.
- To render something in a specific theme (previews, emails), wrap it in an element with `style={themeStyle(theme)}`.
