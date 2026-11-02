# Problem and result

TICKET-022 supplies PRD THM-7: turn one or two wedding colours into a complete, AA-validated draft theme. The pure generator supports light/dark schemes and expected validation errors. Editor integration remains TICKET-098.

# Changes

- Derive brand/control/text colours from seeds, adjusting readable colours towards black/white only as required by contrast.
- Preserve fixed status colours, QR polarity and scheme surfaces; reuse approved font/radius/shadow defaults. Keep decorative seed colours exact and omit preset-specific textures.
- Export the typed result API and document usage, determinism and activation limitations.
- Add66 contract tests over28 seeds and both schemes, invalid inputs, independent outputs and second-seed behavior.

# Acceptance evidence

Both ticket criteria pass:20 deterministic pseudorandom seeds plus8 extremes satisfy the unchanged contrast gate in both schemes; every status token equals its approved scheme baseline. Existing theme suite:145 passed. Quick gate: lint/types/98 related tests passed. Full verification: format/lint/types/722 units passed (27 skipped), build/browser still running. This draft is not ready to merge.

# Review and limitations

Run pnpm test src/modules/theming and inspect generateTheme's result for seed #D6BE8D and optional secondarySeed #432B22. Input is six-digit hex; invalid input returns an expected error. A seed can change brightness for links/buttons; the decorative fill remains exact. No live page or preset changes, so UI screenshots/device certification are not claimed. TICKET-098 must review generated palettes visually before activation. No dependency or migration changes; rollback is reverting this API commit, with no stored-data changes.
