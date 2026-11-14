---
id: TICKET-253
title: Centre and polish the single-panel pages
epic: quality
status: in_review
priority: medium
estimate: M
labels: [frontend]
module: shared
owner: unclechenna
agent: claude
blocked_by: []
blocks: []
branch: TICKET-253
pr: ""
created: 2026-11-13
updated: 2026-11-13
started: 2026-11-13
completed: ""
reason: ""
resume_to: ""
---

# TICKET-253: Centre and polish the single-panel pages

## Context

The owner asked for single-task pages (sign-in and similar) to be centred in height and width and look finished.

## Scope

- Shared `CenteredPanel` (ui): centred both ways; bordered surface from `sm`, edge to edge on phones; theme divider.
- Admin sign-in, sign-out and MFA; staff hub and station sign-in (via `PagePlaceholder`); `/invite`; `/lost-link`;
  `/gate-recovery`; gate pass page and its error states; 404.

## Acceptance criteria

- [x] Each page's content is centred horizontally and vertically (screenshots, 404 smoke test).
- [x] Actions follow their fields instead of being pushed to the bottom.

## Notes / decisions

- 2026-11-13 (unclechenna, claude): builds on TICKET-251 (#216). Empty status lines are hidden until they hold a
  message, so no gap sits between a field and its button.

## Activity log

- 2026-11-13 — new → in_review — unclechenna (claude) — owner asked to centre and polish single-panel pages
