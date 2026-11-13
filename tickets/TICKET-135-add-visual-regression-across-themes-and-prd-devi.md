---
id: TICKET-135
title: Add visual regression across themes and PRD device sizes
epic: testing
status: done
priority: medium
estimate: M
labels: [test, design]
module: shared
owner: unclechenna
agent: claude
blocked_by: [TICKET-013, TICKET-044, TICKET-075]
blocks: [TICKET-154]
branch: TICKET-135
pr: https://github.com/UncleChenna/wedding-app/pull/167
created: 2026-10-21
updated: 2026-11-12
started: 2026-11-12
completed: ""
reason: ""
resume_to: ""
---

# TICKET-135: Add visual regression across themes and PRD device sizes

## Context

Screenshots of every guest page for each preset at iPhone SE, iPhone 15, mid-range Android, iPad and desktop.

See: [What "flawless" means in testing](../docs/prd.md#what-flawless-means-in-testing).

## Scope

- Playwright toHaveScreenshot baselines per theme × device; CI on Linux with stable fonts.

## Out of scope

- Admin pages.

## Acceptance criteria

- [x] A 1px colour change in a token fails the visual suite (proved).
- [x] Baselines committed for every guest route × theme × device.

## Test plan

- End-to-end: Visual suite.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `e2e/visual/`

## Notes / decisions

- 2026-11-12 (unclechenna, claude):
  - **Coverage:** the 7 guest routes (home, invite, lost-link, order, offline, an invitation, a gate pass) × 4 themes
    × 5 PRD sizes (iPhone SE 375×667, iPhone 15 393×852, Android 360×800, iPad 820×1180, desktop 1280×800):
    140 full-page baselines.
  - **Linux-only baselines** (`*-regression-linux.png`), made and compared on CI's runner so fonts match. Local
    renders are git-ignored.
  - **Updating baselines:** a missing one fails the job and is uploaded as the `visual-baselines` artifact to review
    and commit.
  - **Zero colour tolerance** (`threshold: 0`), with 0.2% of pixels allowed for anti-aliasing. Playwright's default
    0.2 colour tolerance missed a one-unit token change.
  - **Size:** 1x pixel density keeps the 140 images at about 8 MB.
  - **Masking:** the signed QR code is masked, because it changes every run by design. A fixed invitation, guest
    and RSVP make the other pages deterministic.

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-12 — todo → claimed — unclechenna (claude) — started ahead of TICKET-075 (in_review)
- 2026-11-12 — todo → in_progress — unclechenna (claude) — started ahead of TICKET-075 (in_review)
- 2026-11-12 — in_progress → in_review — unclechenna (claude)
