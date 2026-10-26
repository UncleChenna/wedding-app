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

## PRD theme names

The PRD (THM-1) sketches a theme file with a smaller set of names. There is one canonical schema (`src/modules/theming/lib/schema.ts`); this is how the PRD names map onto it:

| PRD name                       | Theme file field                                             | Notes                                                                            |
| ------------------------------ | ------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `name`                         | `name` (plus a kebab-case `id`)                              | `id` must match the file name                                                    |
| `colors.background`            | `colors.background`                                          |                                                                                  |
| `colors.surface`               | `colors.surface` (and `surface-muted`)                       |                                                                                  |
| `colors.text`                  | `colors.foreground`                                          |                                                                                  |
| `colors.muted`                 | `colors["muted-foreground"]`                                 |                                                                                  |
| `colors.primary`               | `colors.primary`                                             |                                                                                  |
| `colors.onPrimary`             | `colors["primary-foreground"]`                               |                                                                                  |
| `colors.accent`                | `colors.accent` (and `accent-foreground`)                    |                                                                                  |
| (none)                         | `secondary`, `border`, `input`, `ring` and the status tokens | Needed for controls, focus and fixed status meanings                             |
| `fonts.display` / `fonts.body` | `fonts.display` / `fonts.body`                               | A curated font key (`cormorant`, `playfair`, `inter`, `jost`), not a family name |
| `radius`                       | `radii.sm`, `radii.md`, `radii.lg`                           | Use the PRD radius as `md`; scale `sm` and `lg` around it                        |
| `pattern`                      | `pattern.src` (plus `strength` and `size`)                   | Optional; see below                                                              |

## Paper pattern (optional, off by default)

A theme may add a subtle texture behind **guest pages only**, never staff or admin screens:

```json
"pattern": { "src": "/themes/ivory-gold/paper.svg", "strength": 0.05, "size": "240px" }
```

- **Asset:** an SVG in `public/themes/<theme-id>/`. The schema rejects other folders, other themes' folders and non-SVG files. Draw marks in any opaque colour on a transparent background: the SVG is a CSS mask painted in the theme's `foreground` colour, so it never adds colours of its own and always matches the theme.
- **Strength:** opacity from 0.02 to 0.12. Start at 0.04–0.06; the texture should be felt, not seen. The cap protects text contrast; check the UI checklist screenshots after changing it.
- **Size:** tile size from 64px to 512px. Larger tiles repeat less visibly; 200–300px suits paper grain.
- **Placement:** one fixed layer behind the page content (`<ThemePattern>` in the guest layout), `aria-hidden`, never intercepting taps. For a single invitation-style panel use the shared `<Paper>` component, which applies the same texture inside its bounds; do not hand-roll textures elsewhere.
- Leave `pattern` out for a plain background. Ivory & Gold ships a faint paper grain; Midnight & Champagne is plain.

## Dividers, monogram and paper

Shared decoration components live in `src/modules/shared/components/ui/decorations.tsx` and are shown on `/dev/theme`:

- **`<Divider />`**: a hairline in the `border` token with a small ornament in `primary`; a separator for assistive technology. `variant="staff"` drops the ornament and lightens the line for staff and admin screens.
- **`<Monogram initials={["A", "G"]} />`**: the couple's initials in the display font inside a hairline `primary` ring, named "A & G monogram". Pass `decorative` when the names already appear nearby. Initials will come from event settings (TICKET-025); until then pass them in.
- **`<Paper>`**: a panel with the theme's paper pattern behind its children; plain when the theme has none. Themes without a pattern reset `--t-pattern-*` so they never inherit a parent theme's texture.

Use at most one monogram per page and dividers only between major sections.

## Fonts

Themes pick fonts by key: `cormorant`, `playfair`, `inter`, `jost`. To add a font, load it with `next/font/google` in `src/modules/theming/components/fonts.ts` (variable `--font-<key>`), add the key to `FONT_KEYS` in `lib/schema.ts`, then run `pnpm themes:schema`.

Themes may optionally set `fonts.script` to a curated font key for the couple’s names. When omitted, the script role explicitly resets to that theme’s display font, including inside another theme. Named `type-*` utilities read the scoped `--t-font-*` variables directly so nested previews retain their own font roles. No additional script font is loaded by default.

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
