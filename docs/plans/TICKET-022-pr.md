# Ticket

Ticket: TICKET-022

# Summary

TICKET-022 implements PRD THM-7: turn one or two wedding colours into a complete, AA-validated draft theme. The pure generator supports light/dark schemes and expected validation errors. Editor integration remains TICKET-098.

# Changes

- Derive brand/control/text colours from seeds, adjusting readable colours towards black/white only as required by contrast.
- Preserve fixed status colours, QR polarity and scheme surfaces; reuse approved font/radius/shadow defaults. Keep decorative seed colours exact and omit preset-specific textures.
- Export the typed result API and document usage, determinism and activation limitations.
- Add 66 contract tests over 28 seeds and both schemes, invalid inputs, independent outputs and second-seed behavior.

# Acceptance criteria and evidence

Both criteria pass: 20 deterministic pseudorandom seeds plus 8 extremes satisfy the unchanged contrast gate in both schemes; every status token equals its approved scheme baseline.

# Verification

- Theme suite: 145 passed.
- Quick gate: lint/types/98 related tests passed.
- Full verify at 6c751f42ff1ae1b43252090131d46600adaa2bbd: format/lint/types, 722 unit tests passed (27 conditional skips), production build passed, 697 browser tests passed (147 existing conditional/project skips).
- Initial browser discovery caught missing JSON import attributes. Fixed them and reran the full gate successfully; no checks were weakened.

# Screenshots

N/A: pure library API; no rendered page or active theme changes.

# UI checklist

Run pnpm test src/modules/theming. Call generateTheme with seed #D6BE8D and optional secondarySeed #432B22. Input is six-digit hex; invalid input returns an expected error. A seed can change brightness for links/buttons; the decorative fill remains exact. Generated objects pass the existing schema, contrast, status-hue and QR-polarity validators.

No live page or preset changes. Screenshots, layout, motion, keyboard, guest copy, images/CLS, Lighthouse, WhatsApp, physical QR and staff feedback are N/A for this pure library; they are not claimed as verified. TICKET-098 must review generated palettes visually before activation. This API does not persist or activate themes.

# Risks and rollout

No dependencies, migrations or data writes. Revert this library/export/documentation change to roll back. Existing active themes are unaffected.
