---
id: TICKET-251
title: Centre the not-found page and show one way home
epic: quality
status: done
priority: medium
estimate: S
labels: [frontend]
module: shared
owner: unclechenna
agent: claude
blocked_by: []
blocks: []
branch: TICKET-251
pr: "#216"
created: 2026-11-13
updated: 2026-11-13
started: 2026-11-13
completed: 2026-11-13
reason: ""
resume_to: ""
---

# TICKET-251: Centre the not-found page and show one way home

## Context

The owner asked for the 404 page to sit in the middle of the screen. It currently starts near the top, and it
shows two links to the same place ("Back to home" and "Back to our day"). See
[design principles](../docs/design-principles.md) §1 (one primary action) and §6 (mobile).

## Scope

- Centre the not-found content vertically and horizontally at every width.
- Show a single way back home.

## Out of scope

- The staff pages that share the same layout component keep their current position and back link.

## Acceptance criteria

- [x] At 375, 768 and 1280px the not-found content's vertical centre is within 2px of the viewport's (e2e).
- [x] The not-found page has exactly one link, to `/` (e2e).

## Test plan

- End-to-end: smoke test measures position and links.
- Manual: screenshots at 375px in two themes.

## Files likely touched

- `src/app/not-found.tsx`
- `src/modules/shared/components/page-placeholder.tsx`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-11-13 — new → in_progress — unclechenna (claude) — owner asked to centre the 404 page
