# Ticket

Ticket: TICKET-207

# Summary

Draft: CI has intermittently failed while resolving virtual Google-font assets. This change bundles the approved font families and loads them through next/font/local so builds no longer traverse that Google resolver or fetch fonts externally.

# Changes

- Five WOFF2 files with complete glyph coverage, pinned provenance/hashes and original licenses.
- Preserved variables, fallback metrics, swap, styles, weight ranges and selective preloading.
- Inter optical size fixed at14 to match the previous loader default.
- Regression coverage for loader settings and actual font metadata.
- FONT_COLD_BUILD=1 verification flag uses Next's documented filesystem-cache toggle; normal builds stay cached.

# Acceptance criteria and evidence

Original failure log saved; unchanged fresh baseline passed, confirming intermittent behavior rather than deterministic local reproduction. Local loading avoids the implicated resolver but does not claim to repair the compiler itself.

Three cold production builds passed. Three unit regressions and eight production typography browser cases passed, including zero CLS on the theme showcase. Final CI, visual inspection, broader no-JavaScript/network checks, Lighthouse and full verification remain outstanding.

# Verification

See docs/handoffs/TICKET-207.md and artifacts/TICKET-207 logs. Build base fd91e877e29b32ef911acfd45036ad65767732c7. All60 screenshot captures passed across five routes, four themes and375/768/1280 widths; visual inspection is still pending.

# Risks and rollout

Full font files are larger than Google's individual subsets; performance and preload cost must be assessed before readiness. No migration, auth or dependency change. Revert the ticket to restore Google loading if necessary. Font updates require provenance/license review and the documented conversion/verification process.

# Screenshots

Captured under artifacts/screenshots; inspection pending, not yet approved.

# UI checklist

Incomplete. Font-role and theme-showcase CLS assertions pass. Remaining visual, performance, accessibility/full-gate and affected device limitations will be documented before review readiness.

# Harness changes, if any

Opt-in cold-build flag only; no CI or test gate is weakened.
