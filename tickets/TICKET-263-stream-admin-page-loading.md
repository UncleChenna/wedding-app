---
id: TICKET-263
title: Stream admin page loading during navigation
epic: foundations
status: in_review
priority: high
estimate: S
labels: [frontend]
module: admin
owner: UncleChenna
blocked_by: []
blocks: []
branch: TICKET-263
pr: ""
created: 2026-11-15
updated: 2026-11-15
---

# TICKET-263: Stream admin page loading during navigation

## Scope

Add a protected admin route-segment loading boundary. The shared layout remains mounted
on admin navigation, so its authentication Suspense alone cannot cover new page reads.
Settings and sibling pages must stream live data without globally caching private data.

## Acceptance criteria

- [x] Protected admin pages have a static, accessible loading status.
- [x] Settings retains live database reads and existing authorization.

## Test plan

Full verification and local authenticated navigation to settings. No animation or new tokens.

## Verification

Local authenticated client navigation to `/admin/settings` rendered Event settings with no
page errors. Full verification: formatting, lint, types, 2147 tests passed (237 skipped).
Physical-device and all-theme screenshot checks were not run for this static text fallback.
