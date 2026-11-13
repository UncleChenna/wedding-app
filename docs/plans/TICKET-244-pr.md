# Ticket

Ticket: TICKET-244

# Summary

The shared font registry preloaded Inter on every page, including configured Playfair/Jost invitations. Disable that single preload. Font files, weight ranges, fallback metrics, glyph coverage and theme choices remain intact.

# Changes

- Set Inter Latin to load on demand without changing its files or fallback metrics.
- Extend the font contract test and add recorded per-theme network checks.

# Acceptance criteria and evidence

- Five font-asset tests pass. The updated expectation failed before the implementation change.
- Production build passes against the integrated runtime changes from develop `5c60dda9`.
- Sixteen existing browser checks pass: no-JavaScript rendering, original/subset glyph equivalence and twelve delayed-font layout checks across four themes and 375/768/1280px.
- Four additional theme-demand cases pass in 8.8s. They verify absent Inter preloads, on-demand Inter for Inter themes, complete fallback for synthetic Igbo/accented names, no horizontal overflow and zero WCAG AA violations. Screenshots and network JSON are in `docs/reviews/TICKET-244/`.
- Jost themes request no Inter font. TICKET-116's earlier actual invitation baseline downloaded 50,501 bytes of unused Inter. These are separate fixtures, not a paired Lighthouse comparison or a claim that performance now reaches 95.
- Independent source and test review found no blocking issue.

# Verification

Production build, five unit tests, sixteen existing browser cases and four new theme-demand cases pass. Normal commit lint, types and related tests pass. Independent review found no blocker. Full CI and physical-device release checks are not yet complete.

# Screenshots

Four mobile screenshots and their network JSON are in `docs/reviews/TICKET-244/`. Existing 375/768/1280 cold-font geometry assertions pass; a new full screenshot matrix was not repeated for this preload-only change.

# UI checklist

PASS: shared tokens, unchanged typography/spacing/copy/components, all-theme WCAG AA, preserved glyphs, reserved image space and existing zero-shift font assertions. Mobile screenshots include a synthetic accented greeting; the stock photo remains a sample. The test waits for image decoding before capture.

The network fixture boots with the registered Jost dark theme and applies each selected theme at the root before switching scheme, avoiding an unrelated intermediate default-light Inter request. It verifies theme request contracts; the shipped Ivory preset still uses Inter, while the configured wedding theme uses Jost.

The preview's existing introductory navigation outside a landmark triggers axe's best-practice `region` rule. This is recorded, not claimed fixed; the new scan targets WCAG 2/2.1/2.2 AA. Existing browser tests were not weakened.

No interaction, animation, QR, sharing or staff-feedback implementation changes. Their physical-device checks remain unverified under the existing release gates. The final complete guest Lighthouse gate remains TICKET-116; device/WhatsApp checks remain TICKET-201. This small optimization does not certify release readiness.

# Risks and rollout

Includes the already merged runtime/CI improvements and carries the unchanged merged TICKET-243 definition because the current validator requires it on older branches. No migration or dependency change. Reverting the preload option restores prior loading behavior without changing data.
