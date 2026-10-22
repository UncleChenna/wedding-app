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
3. **Register** it alongside the existing imports and entries in `src/modules/theming/themes/index.ts`:
   ```ts
   import sageGarden from "./sage-garden.json" with { type: "json" };
   export const themes = [ivoryGold, midnightChampagne, sageGarden].map(loadTheme);
   ```
4. **Check**: `pnpm test src/modules/theming`. If a colour pair fails contrast you get a message like
   `Theme "sage-garden" fails WCAG AA contrast: - muted-foreground on background: 3.80:1 (needs 4.5:1, secondary text on page)`.
   Darken/lighten the named token and re-run.
   Registration validates every theme when the registry loads, even if the new theme is not active. The error includes the theme ID and every failing text or control pair. A passing check also verifies that every theme JSON is registered and its ID matches its filename.
5. **Look**: `pnpm dev` → http://localhost:3000/dev/theme shows every component in every theme. For phone/tablet/desktop screenshots: `pnpm screenshots`.

## Colour tokens

| Token                                | Used for                                       | Must contrast with (AA)                                    |
| ------------------------------------ | ---------------------------------------------- | ---------------------------------------------------------- |
| `background`                         | Page                                           | —                                                          |
| `foreground`                         | Body text                                      | background, surface, surface-muted (4.5)                   |
| `surface` / `surface-muted`          | Cards, sheets / muted panels, disabled inputs  | —                                                          |
| `muted-foreground`                   | Secondary text, hints                          | background, surface (4.5)                                  |
| `primary` / `primary-foreground`     | Main buttons, links / text on primary          | primary on background & surface (4.5); fg on primary (4.5) |
| `secondary` / `secondary-foreground` | Secondary buttons                              | 4.5                                                        |
| `accent` / `accent-foreground`       | Highlights                                     | 4.5                                                        |
| `border`                             | Decorative dividers                            | —                                                          |
| `input`                              | Form field borders                             | surface (3.0, non-text)                                    |
| `ring`                               | Focus outline                                  | background, surface (3.0)                                  |
| `danger` / `danger-foreground`       | Errors, destructive                            | danger on surface (4.5); fg on danger (4.5)                |
| `success` / `success-foreground`     | Valid / done; confirmations                    | fg on success (4.5); success on surface (3.0, indicator)   |
| `warning` / `warning-foreground`     | Already used / waiting                         | fg on warning (4.5); warning on surface (3.0, indicator)   |
| `<status>-subtle`                    | Tinted status panel (success, warning, danger) | —                                                          |
| `<status>-subtle-foreground`         | Text on the tinted panel or on cards           | on `<status>-subtle` and on surface (4.5)                  |

### Fixed status meanings

Staff screens use three statuses whose meaning never changes between themes (PRD THM-4, design principles §9):

| Status    | Meaning               | Hue range (HSL) | Tokens                                                                         |
| --------- | --------------------- | --------------- | ------------------------------------------------------------------------------ |
| `success` | Valid, done           | 90–170° (green) | `success`, `success-foreground`, `success-subtle`, `success-subtle-foreground` |
| `warning` | Already used, waiting | 25–60° (amber)  | `warning`, `warning-foreground`, `warning-subtle`, `warning-subtle-foreground` |
| `danger`  | Invalid, problem      | 345–15° (red)   | `danger`, `danger-foreground`, `danger-subtle`, `danger-subtle-foreground`     |

A theme may change a status colour's lightness to meet contrast, but `loadTheme` rejects any theme whose solid status colour or `-subtle-foreground` falls outside its hue range or below 30% saturation (it would read as grey). The error names the token and the expected colour family. The ranges live in `STATUS_HUE_RANGES` in `src/modules/theming/lib/status.ts`.

On light themes a bright amber cannot reach 3:1 against a white card, so the solid `warning` is a deep honey colour and the tinted `warning-subtle` panel carries the bright amber look. Always pair a status colour with a text label or icon; colour alone never carries meaning. `/dev/theme` shows all three statuses in every theme.

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

## Shared motion tokens

Motion timings are a shared accessibility contract in `src/app/globals.css`, identical in all colour themes: `--motion-duration-control` 180ms, `--motion-duration-enter` 240ms, `--motion-duration-signature` 600ms, `--motion-easing` cubic-bezier(0.2, 0, 0, 1), and `--motion-distance-rise` 0.5rem. These are not new JSON colour tokens.

Use `FadeIn` or `Rise` from shared UI to animate server-rendered content with CSS only. Default pace is `enter`; `pace="signature"` reserves the 600ms timing for special moments. TICKET-039 implements the actual envelope reveal. Wrappers do not wait to mount children, hide content with JavaScript, or block actions. Do not wrap a sticky/fixed overlay in a transformed entrance.

Reduced motion disables these entrance animations and the demo's control transition entirely, leaving content immediately visible. `/dev/theme` has a keyboard-accessible replay demo in each theme. Its replay control uses the 180ms opacity transition; existing unrelated component motion is outside this ticket.
