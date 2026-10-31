---
id: TICKET-207
title: Make cold font builds deterministic
epic: design-system
status: in_progress
priority: high
estimate: M
labels: [frontend, test, infra]
module: theming
owner: divine
agent: codex
blocked_by: [TICKET-015]
blocks: []
branch: TICKET-207
pr: ""
created: 2026-10-31
updated: 2026-10-31
started: 2026-10-31
completed: ""
reason: ""
resume_to: ""
---

# TICKET-207: Make cold font builds deterministic

## Context

[Typography architecture](../docs/theming.md) uses next/font. CI runs41183604621 (PR54) and41184988139 (PR56) failed with Turbopack's Google font resolver error: next/font/google queries have exactly one entry. PR54 passed unchanged on one retry. Local builds passed. This recurring build failure needs a permanent, evidenced fix.

## Scope

Reproduce and diagnose cold-build font resolution. Evaluate pinned, licensed local font assets with next/font/local or a narrowly justified compiler fix. Preserve approved families, weights, CSS variables, fallback metrics and swap behavior. Document asset source, license and update process if fonts are vendored.

## Out of scope

Changing typography design, weakening gates, disabling font verification or installing unrelated dependencies. Do not treat retries alone as the fix.

## Acceptance criteria

- [ ] Record a reproducible diagnosis and why the selected fix addresses the observed resolver failure.
- [ ] Three fresh production builds and the final required CI pass without relying on pre-existing font/build cache.
- [ ] Approved font families/weights and CSS variables remain correct in all four themes at375/768/1280; record inspected evidence.
- [ ] If assets are vendored, their provenance and redistribution licenses are committed and loading needs no external Google Fonts request.
- [ ] Performance, accessibility, layout-shift measurements and the full verification gate are recorded; any unrelated existing QA limits remain explicit.

## Test plan

Unit: font-role and configuration regressions. End-to-end: cold production builds in isolated clean environments; pnpm verify; font-role regressions, no-JavaScript rendering and all-theme screenshots. Compare Lighthouse and font-swap layout shifts with TICKET-012's recorded baseline. Confirm the root cause rather than relying on a passing retry.

## Files likely touched

src/modules/theming/components/fonts.ts, licensed font assets if selected, typography tests, docs/theming.md and ticket-specific review evidence.

## Notes / decisions

Created from two observed CI failures on31October2026. No implementation is included in TICKET-012's PR.

## Activity log

- 2026-10-31 — new → todo — divine — recurring font build failure
- 2026-10-31 — todo → claimed — divine (codex)
- 2026-10-31 — todo → in_progress — divine (codex)
- 2026-10-31 — in_progress → blocked — divine (codex) — Draft PR #63 final assets pass full verification; final-head CI pending, strict UI completion remains limited by invitation performance below 95 and physical-device QA recorded for TICKET-201
- 2026-10-31 — blocked → in_progress — divine (codex) — User approved proceeding to review with TICKET-201 release gates retained; CI41238775314 passed
