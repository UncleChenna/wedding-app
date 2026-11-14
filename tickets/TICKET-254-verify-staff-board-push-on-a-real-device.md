---
id: TICKET-254
title: Verify staff-board push on a real device
epic: pwa
status: todo
priority: low
estimate: S
labels: [human, pwa]
module: ordering
owner: ""
agent: ""
blocked_by: [TICKET-112, TICKET-148]
blocks: []
branch: ""
pr: ""
created: 2026-11-13
updated: 2026-11-13
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-254: Verify staff-board push on a real device

## Context

TICKET-112 shipped optional push notifications for the kitchen and bar boards. Its tests prove the board, the
service worker and the delivery queue, but not delivery through a real push service (FCM, Apple) to a real phone
or tablet, which needs a deployed site with the `WEB_PUSH_*` settings.

## Scope

- With the `WEB_PUSH_*` settings configured on a deployed preview, sign in to `/kitchen` on a real Android device
  and an installed iOS home-screen app, allow notifications, place an order and confirm the notice arrives.
- Confirm denying permission leaves the board working on both.

## Out of scope

- Code changes: open a new ticket if delivery fails.

## Acceptance criteria

- [ ] A real order produces a generic notification on an Android device and an installed iOS app (devices and
      result recorded in notes).

## Test plan

- Manual: the steps in Scope, on the devices from TICKET-055.

## Files likely touched

- None (notes only).

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-11-13 — new → todo — unclechenna (claude) — split from TICKET-112's real-device delivery check
