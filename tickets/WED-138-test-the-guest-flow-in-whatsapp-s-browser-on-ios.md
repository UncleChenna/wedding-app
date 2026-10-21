---
id: WED-138
title: Test the guest flow in WhatsApp's browser on iOS and Android
epic: testing
status: todo
priority: high
estimate: S
labels: [human, test]
module: ops
owner: ""
agent: ""
blocked_by: [WED-044, WED-047, WED-154]
blocks: [WED-159]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-138: Test the guest flow in WhatsApp's browser on iOS and Android

## Context

Most guests open the IV inside WhatsApp's in-app browser; emulation does not prove it works.

See: [Design principles](../docs/prd.md#design-principles) · [What "flawless" means in testing](../docs/prd.md#what-flawless-means-in-testing).

## Scope

- From a real WhatsApp message: preview, IV, RSVP, tag-alongs, pass save, offline reopen, on one iPhone and one Android.

## Out of scope

- Other messengers.

## Acceptance criteria

- [ ] Device/OS/WhatsApp versions and pass/fail per step recorded with screenshots.
- [ ] Every failure has a fix-up ticket.

## Test plan

- Manual: Real devices.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `docs/audits/`

## Notes / decisions

- 2026-10-21: Needs a person (decision, account or physical task). Agents may prepare docs and record the outcome.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
