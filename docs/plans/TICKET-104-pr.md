# Ticket

TICKET-104

# Summary

The app previously advertised no installation icons. It now serves generated UA monogram icons and Apple startup artwork, selected by the active light preset.

# Changes

- Reproducible script emits68 opaque PNGs across four themes:192/512 any and maskable icons,180 Apple touch, twelve portrait/landscape startup sizes per theme.
- Bundled font outlines and theme tokens; no system fonts, network generation or new dependencies.
- Manifest entries and Apple metadata point to real assets. Standard and Apple capability metadata are included.
- Tests verify safe bounds, repeat bytes, committed asset parity, sizes and public URLs.

# Acceptance criteria and evidence

Maskable safe-zone checks pass in pixel tests and inspected Maskable.app screenshots for every theme. Reproducibility and output sizes pass. Apple touch metadata and public asset URLs pass browser checks. Physical iOS/Android installed icons and startup behavior remain unverified in an explicit unchecked TICKET-201 criterion, blocking both guest releases; TICKET-114 retains the full PWA device suite. This follows the owner's approved separation of preview delivery and device QA.

# Verification

Integrated develop4463a2ed2d13c751e6b9e31858775a15c7bd097a (PR67 font fix) in2043800fecf5289f60e97e8c6b9345a993e0462e. Full local pnpm verify PASS:526unit passed/26skipped,617browser passed/135skipped; format, lint, types and production build also pass. Log: artifacts/TICKET-104/integrated-verify.log. Ticket validation/render pass after explicit QA ownership clarification. Hosted integration run41284490624 passed all four CI jobs. The publishing workflow repeated the full gate successfully at7a72a69; its owner-resolution error was recovered through the CLI using that exact verified commit. Final-head CI is still required before merge.

Earlier failures are preserved in docs/handoffs/TICKET-104.md and ignored logs: initial4mobile QR timeouts, recheck1mobile stepper timeout, hosted2dark-envelope CLS failures. TICKET-210 diagnosed and fixed real text movement with controlled font-delay regressions; no test assertions or thresholds were weakened. Fifteen focused unit cases and six production browser cases also passed during implementation.

# Risks and rollout

Preview delivery only under the owner's standing approval; physical installation is not certified. TICKET-201 blocks both releases and TICKET-114 remains mandatory for full PWA installation. Startup matrix covers six common CSS screen/DPR combinations in both orientations, not every device. UA and preset artwork are generated at build/development time: changing names, tokens or bundled fonts requires regeneration; unknown theme IDs fall back to Ivory & Gold. OS refresh timing is outside app control. No migration/dependency change. Revert this ticket to remove metadata/assets; no user data changes.

# Screenshots and UI checklist

docs/reviews/TICKET-104 contains all-theme contact sheets, four Maskable.app screenshots and the complete scoped checklist. No rendered page UI changed. Device results remain NOT VERIFIED.

# Harness changes

None. Run pnpm exec tsx scripts/pwa-icons.ts to regenerate.

# Review steps

1. Run pnpm exec tsx scripts/pwa-icons.ts; confirm generated files remain byte-identical.
2. Build and serve; inspect /manifest.webmanifest and root Apple touch/startup link metadata. Follow their URLs and check the selected light-theme artwork.
3. Inspect the four asset contact sheets and Maskable.app evidence in docs/reviews/TICKET-104.
4. Complete physical installation using the unchecked TICKET-201/TICKET-114 checks before releasing to guests. Browser emulation is not physical proof.

No database migration, environment change or new dependency is required.
