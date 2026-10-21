---
id: TICKET-138
title: Test the guest flow in WhatsApp's browser on iOS and Android
epic: testing
status: todo
priority: urgent
estimate: S
labels: [human, test]
module: ops
owner: ""
agent: ""
blocked_by: [TICKET-044, TICKET-047, TICKET-045, TICKET-107, TICKET-149, TICKET-055, TICKET-041, TICKET-039]
blocks: [TICKET-154, TICKET-159, TICKET-176]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-138: Test the guest flow in WhatsApp's browser on iOS and Android

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

- [ ] Run real iOS and Android WhatsApp link/preview/share/save-pass journeys against staging before TICKET-176; failures require fixes and retest. Do not wait for full wedding-day deployment.

## Test plan

- Manual: Real devices.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Manual: record app/OS/browser versions, approved wording, QR image save and link behavior without private guest screenshots.

## Files likely touched

- `docs/audits/`

## Notes / decisions

- 2026-10-21: Needs a person (decision, account or physical task). Agents may prepare docs and record the outcome.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
