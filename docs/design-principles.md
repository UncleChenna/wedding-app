# Frontend design principles

These rules apply to every agent and human changing UI. Complete [the UI checklist](ui-checklist.md) before marking UI work done. Token definitions and extension steps live in [theming.md](theming.md).

**North star:** the site should feel like a beautifully printed wedding invitation that happens to be alive. When in doubt, remove something.

## 1. Restraint

- Give each screen or section one main idea and at most one primary action. Use at least 24px between distinct content groups on mobile and 48px between major sections.
- Use at most three intentional interface colours per guest-facing section: background, text, and one accent, all from theme tokens. Photography is not part of this palette. Staff status colours follow section 9.
- Do not add decoration without a purpose: no stacked borders, heavy shadows, gradients, or icons on every item. Use shadows only where needed to communicate elevation, such as an overlay.
- Never hard-code colours, font families, radii, or shadows in components. Use theme CSS variables or Tailwind theme classes. Define new tokens through the documented theming process.

## 2. Typography

- Use the theme's display serif for names and headings (`font-display`); use its body sans for other text (`font-sans`, the current body-font utility).
- Main headings start at 32px on mobile and 48px on desktop, with letter spacing between -0.02em and 0. Use the existing typography scale; allow wrapping instead of overflow.
- Small labels use uppercase or small caps with 0.08–0.15em letter spacing, for example “THE CELEBRATION” or “TABLE 12”.
- Body text is at least 16px on mobile, with line height 1.5–1.7. Set prose widths to 45–75ch where the viewport permits; narrow phones may have shorter lines without horizontal scrolling.
- If a theme provides a script font, use it only for the couple's names.

## 3. Photography

- Prefer one strong hero image over a gallery. Use full-bleed photography where appropriate and preserve the subject with deliberate crops at all three review widths.
- Use `next/image` for every photograph or raster content image, with accurate responsive `sizes`, intrinsic dimensions or a reserved aspect-ratio container, AVIF/WebP delivery, and `placeholder="blur"`. Provide `blurDataURL` when it cannot be inferred from a static import.
- Give meaningful images descriptive alt text. Purely decorative images use `alt=""`.
- Functional SVG icons and generated QR codes are not photographs; keep them accessible and crisp rather than applying photographic blur placeholders.

## 4. Motion

- Use fades, gentle rises, or soft unfolds. Do not use bouncing, spinning, or elastic effects.
- Ordinary transitions last 150–300ms. Signature moments, such as opening an invitation, last at most 800ms and never delay access to content or actions.
- Animate only `opacity` and `transform`; do not animate layout properties.
- Honour `prefers-reduced-motion`: remove movement and use no animation or a simple opacity fade of at most 150ms. Test this mode explicitly.

## 5. Detail and texture

- Paper grain, monograms, and hairline dividers must come from the theme and support the content. Do not introduce one-off decorative styles.
- Theme QR frames and colours while retaining a dark code on a light background, at least 4.5:1 contrast, and an uninterrupted quiet zone at least four QR modules wide on every side. Do not cover or distort modules. Verify actual scanning on iOS and Android.
- Every guest-facing page must resolve appropriate Open Graph title, description, and image metadata, including inherited defaults. Use a 1200×630 preview image and check the shared link in WhatsApp. Do not expose personal invitation secrets or guest details in public previews.

## 6. Mobile and thumb-first

- Design at 375px first, then review 768px and 1280px. No horizontal page scrolling at these widths or intermediate widths.
- Put primary actions near the bottom on mobile, within thumb reach. Sticky actions must not cover content, focused fields, or the on-screen keyboard.
- Every tap target is at least 44×44 CSS pixels. Use safe-area insets for controls near notched screen edges.
- Prefer bottom sheets to centred modals on mobile.
- Guest flows must work in WhatsApp's in-app browser on both iOS and Android. Check navigation, forms, keyboard behaviour, and primary actions on real devices; desktop emulation alone does not prove compatibility.

## 7. Speed is part of the design

- Target CLS = 0 on load. Reserve image dimensions and use font fallback metrics so loading images or fonts does not move content.
- Load fonts through `next/font` with `display: "swap"`; match fallback metrics to avoid a visible unstyled-text flash or layout jump.
- Use Server Components by default. Add `"use client"` only at the smallest boundary requiring interaction or browser APIs.
- Guest pages target Lighthouse mobile scores of at least 95 for both Performance and Accessibility. Measure against a production build and record the route and scores.

## 8. Copy and voice

- Keep headings, buttons, empty states, loading messages, and errors warm, short, and human. Prefer button labels of 1–4 words and one short sentence for status messages.
- Never show raw error codes, stack traces, or technical messages to guests. Explain the next useful action in plain language.
- Reuse approved wording from [the PRD](prd.md) when available. Until approved copy exists, follow this voice consistently and identify provisional wording in the task summary.

## 9. Staff screens

- Gate scanning, kitchen/bar boards, and admin screens prioritise calm, arm's-length readability over decoration. Use body/control text of at least 18px and primary scan results or board identifiers of at least 32px.
- Keep high contrast and a clear hierarchy. Status meanings are fixed across every theme: green = valid/done; amber = already used/waiting; red = invalid/problem.
- These semantic status colours are an exception to the three-colour guest palette. Define them as shared semantic tokens with stable hues across themes; do not use literal colours in components. If a required token is absent, add it through the theming process before using it.
- Pair every status colour with text or an icon and an accessible label. Adjust token foreground/background combinations to retain AA contrast in each theme.
- Every action gives immediate visual feedback. Successful scans also request sound and vibration where supported and permitted; handle unavailable or blocked audio/haptics without losing the visual result or preventing check-in.

## 10. Consistency

- Build with components from `src/modules/shared/components/ui`. Do not create one-off buttons, cards, or inputs.
- Add any new reusable UI pattern to shared components and demonstrate it on `/dev/theme`.
- Review every affected screen in every registered theme, with a minimum of two themes, at all three review widths. Theme switching must preserve layout, meaning, and usability.

## 11. Accessibility

- Meet WCAG 2.2 AA, the project's existing baseline (which includes the requested WCAG 2.1 AA baseline).
- Require at least 4.5:1 contrast for all text, including headings; require at least 3:1 for focus indicators and essential control boundaries against adjacent colours.
- Use semantic HTML, visible focus states, full keyboard access, and explicit labels for form fields. Dialogs must manage focus, support Escape, and restore focus to the trigger.
- Never convey meaning through colour alone. Pair it with visible text or an understandable icon with an accessible name.
