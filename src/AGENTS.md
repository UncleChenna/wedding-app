# Frontend work under src/

Apply these rules whenever changing UI; root project instructions still apply.

- Aim for a printed wedding invitation: one main idea per section; remove clutter.
- Use theme tokens for colours, font families, radii, and shadows.
- Guest sections use background, text, and one accent; avoid gratuitous decoration.
- Use the display serif for headings/names and body sans for other text.
- Body text: at least 16px, line height 1.5–1.7, prose width 45–75ch where it fits.
- Use restrained photography with `next/image`, responsive sizes, blur, and alt text.
- Animate only opacity/transform: 150–300ms normally, at most 800ms for signatures.
- Respect reduced motion; never block an action with animation.
- Design at 375px; review 768px and 1280px; prevent horizontal scrolling.
- Tap targets must be at least 44×44px; account for safe areas and keyboards.
- Keep mobile primary actions near the bottom; prefer bottom sheets.
- Reserve image/font space (CLS = 0); use `next/font` with swap.
- Default to Server Components; keep interaction boundaries small.
- Guest pages target Lighthouse mobile Performance and Accessibility scores ≥95.
- Use warm, brief copy and approved PRD wording; hide technical errors from guests.
- Staff screens use large text and fixed semantic status tokens across themes.
- Green = valid/done; amber = used/waiting; red = invalid/problem.
- Give immediate visual feedback; successful scans request supported sound/vibration.
- Reuse shared UI; demonstrate new reusable patterns on `/dev/theme`.
- Meet WCAG 2.2 AA; ensure keyboard access, labels, focus, and non-colour cues.
- Keep QR contrast/quiet zones intact and guest link previews suitable for WhatsApp.
- Review every theme (at least two) and WhatsApp guest flows on iOS and Android.
- Before completion, report results for [the UI checklist](../docs/ui-checklist.md).

Full rules and measurable requirements: [docs/design-principles.md](../docs/design-principles.md).
