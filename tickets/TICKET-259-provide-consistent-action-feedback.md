---
id: TICKET-259
title: Provide consistent action feedback across the app
epic: foundations
status: in_review
priority: high
estimate: L
labels: [frontend]
module: shared
owner: "chenna"
agent: ""
blocked_by: []
blocks: []
branch: "TICKET-259"
pr: ""
created: 2026-11-14
updated: 2026-11-14
---

# TICKET-259: Provide consistent action feedback across the app

## Context

The owner requests visible toast or modal feedback for transactions, notifications and updates throughout the website.

## Scope

- Shared, bounded notification lifecycle and explicit action-result feedback.
- Guest, staff and admin mutations; consequential actions use confirmation dialogs.
- Preserve inline validation, scanner results and durable offline/live status displays.

## Acceptance criteria

- [x] Completed actions show user-facing feedback without replaying initial or unchanged state.
- [x] Toasts are bounded, dismissible and accessible; failures remain available inline.
- [x] Menu removal and staff access removal/reset require confirmation.
- [x] Background polls do not produce repeated unchanged notifications.
- [x] Focus, short-screen layouts and reduced motion remain usable.

## Test plan

- Unit: feedback transitions, repeat actions, toast bounds, confirmation cancellation/submission.
- Browser: mobile/tablet/desktop feedback and confirmation interactions.
- Run quick and full verification; document unavailable checks.

## Review evidence

See [feedback review](../docs/reviews/TICKET-259/feedback.md). `pnpm verify` passed. Physical-device testing and live database mutations were not re-run.
