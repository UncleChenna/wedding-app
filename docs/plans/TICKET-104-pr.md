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

Maskable safe-zone checks pass in pixel tests and inspected Maskable.app screenshots for every theme. Reproducibility and output sizes pass. Actual iOS home-screen icon and Android installation remain unverified; manual criterion stays unchecked.

# Verification

Fifteen focused unit cases and six production browser cases pass. First full gate:526unit passed/26skipped;573browser passed/135skipped/4mobile QR timeouts. Unchanged focused QR rerun:8passed. Full-gate recheck remains outstanding; see docs/handoffs/TICKET-104.md. Base c9edef6cb137a194f9c215fc5b61b08488a54aa0.

# Risks and rollout

Draft until physical-device criterion is resolved. TICKET-114 remains mandatory. Startup matrix covers six common CSS screen/DPR combinations in both orientations, not every device. UA and preset artwork are generated at build/development time: changing names, tokens or bundled fonts requires regeneration; unknown theme IDs fall back to Ivory & Gold. OS refresh timing is outside app control. No migration/dependency change. Revert this ticket to remove metadata/assets; no user data changes.

# Screenshots and UI checklist

docs/reviews/TICKET-104 contains all-theme contact sheets, four Maskable.app screenshots and the complete scoped checklist. No rendered page UI changed. Device results remain NOT VERIFIED.

# Harness changes

None. Run pnpm exec tsx scripts/pwa-icons.ts to regenerate.
