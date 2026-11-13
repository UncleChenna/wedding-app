---
id: TICKET-244
title: Avoid preloading unused Inter on other font themes
epic: quality
status: done
priority: high
estimate: S
labels: [frontend, test]
module: theming
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: TICKET-244
pr: https://github.com/UncleChenna/wedding-app/pull/204
created: 2026-11-13
updated: 2026-11-13
started: 2026-11-13
completed: ""
reason: ""
resume_to: ""
---

# TICKET-244: Avoid preloading unused Inter on other font themes

## Context

TICKET-116’s actual hero baseline on develop `21722cb97d525a683e0fcd85a4007bbda5db9a76` reports invitation Performance 94/90/88 (median 90), Accessibility 100 and CLS 0. The median report transfers 50,501 bytes for Inter Latin even though the active TICKET-014 default theme uses Playfair/Jost. `src/modules/theming/components/fonts.ts` leaves Inter’s preload enabled while all other primary/complete faces disable it; root applies every font variable. See [PRD performance](../docs/prd.md#performance-and-reliability) and TICKET-116’s `docs/reviews/TICKET-116/post-hero-baseline.json` evidence.

## Scope

- Disable only the unconditional Inter Latin preload so rendered theme text requests its actual font.
- Preserve all font faces, fallback metrics, complete glyph coverage and theme font choices.
- Verify all themes and record actual network evidence that a Playfair/Jost page no longer preloads unused Inter.

## Out of scope

- Removing fonts/glyphs, changing invitation wording, raising performance thresholds or altering the theme design.
- Client parser optimization (TICKET-240) and final nine-run guest performance gate (TICKET-116).

## Acceptance criteria

- [x] A default Playfair/Jost invitation does not request Inter solely through a root preload; capture before/after network bytes.
- [x] Themes that use Inter still render with Inter on demand; all four themes retain correct display/body families.
- [x] Igbo and accented names/menu text still load their required complete font fallback, without missing glyphs or prohibited font substitution.
- [x] Existing font asset/metric tests and focused all-theme cold-font accessibility/layout checks pass without weakened assertions; report remaining manual release checks honestly.

## Test plan

- Unit: update font registration expectation to prohibit unconditional preload while retaining all primary/complete faces and metrics.
- End-to-end: cold browser font requests in each theme with representative accented/Igbo content; verify applied family and existing layout/console assertions.
- Manual: inspect representative mobile screenshots; final Lighthouse remediation proof remains in TICKET-116 after integration.

## Files likely touched

- `src/modules/theming/components/fonts.ts`
- `src/modules/theming/__tests__/font-assets.test.ts`
- Focused font browser evidence and ticket review notes.

## Notes / decisions

- Full Jost’s 51,597-byte request in the same baseline is legitimate non-Latin fallback for the fixture’s Igbo meal name; do not remove it to improve scores.
- Scoped preload-only change, not a claim that this alone achieves Performance 95.

- 2026-11-13: Disabled only Inter preload. Five asset tests pass after reproducing the missing option; production build passes. Sixteen existing font/no-JavaScript/glyph/cold-swap browser cases pass, plus four theme-demand cases with WCAG AA scans and saved network/screenshots. Jost themes request zero Inter files; full glyph fallback remains. Evidence and limitations: docs/plans/TICKET-244-pr.md.

## Activity log

- 2026-11-13 — new → todo — divine
- 2026-11-13 — todo → claimed — divine (codex)
- 2026-11-13 — todo → in_progress — divine (codex)
- 2026-11-13 — in_progress → in_review — divine (codex)
