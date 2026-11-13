---
id: TICKET-038
title: Add the full-bleed hero photo with blur placeholder
epic: invitations
status: todo
priority: urgent
estimate: M
labels: [frontend, design]
module: invitations
owner: ""
agent: ""
blocked_by: [TICKET-037]
blocks: [TICKET-099, TICKET-116, TICKET-119, TICKET-154, TICKET-176]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-038: Add the full-bleed hero photo with blur placeholder

## Context

A full-bleed couple photo is the IV's hero; it must not cause layout shift or slow the page.

See: [Design principles](../docs/prd.md#design-principles) · [Design principles (repo)](../docs/design-principles.md).

## Scope

- `next/image` with accurate `sizes`, AVIF/WebP, `placeholder="blur"`, deliberate crops at three widths.
- Descriptive alt text from settings.
- Use the approved stock asset for development/review previews if final photos are unavailable, retaining source/licence attribution. Clearly identify stock imagery in preview contexts and never describe its subjects as Uchenna and Adaora; the real invitation must not misrepresent placeholder imagery as their portrait.

## Out of scope

- Photo upload UI (TICKET-099).

## Acceptance criteria

- [ ] CLS is 0 on /i/<token> in Lighthouse mobile.
- [ ] Network panel shows AVIF or WebP served at 375px.
- [ ] Subject is in frame at 375, 768 and 1280 (screenshots attached).
- [ ] Preview evidence identifies stock imagery and its attribution; replacing it with the final approved asset uses the same rendering contract. TICKET-008 final asset/rights/visual approval remains mandatory before release.

## Test plan

- End-to-end: CLS measured via PerformanceObserver in Playwright.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/invitations/components/`
- `public/`

## Notes / decisions

- 2026-11-13 — TICKET-236: public/share/ATTRIBUTION.md records the approved stock preview. Its 1600px-wide asset does not satisfy TICKET-008’s final >=2400px-wide hero requirement. All existing format, crop and CLS criteria remain.

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
