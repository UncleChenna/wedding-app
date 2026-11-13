---
id: TICKET-094
title: Print table cards with the shared order QR and Wi-Fi details
epic: admin
status: in_progress
priority: high
estimate: M
labels: [frontend, design]
module: admin
owner: unclechenna
agent: claude
blocked_by: [TICKET-011, TICKET-093, TICKET-170]
blocks: [TICKET-154, TICKET-160]
branch: TICKET-094
pr: ""
created: 2026-10-21
updated: 2026-11-12
started: 2026-11-12
completed: ""
reason: ""
resume_to: ""
---

# TICKET-094: Print table cards with the shared order QR and Wi-Fi details

## Context

Every table card shows its number, the one shared order QR, and the router's Wi-Fi name and password.

See: [Admin dashboard](../docs/prd.md#admin-dashboard) (ADM-2) · [Connectivity plan](../docs/prd.md#connectivity-plan-signal-unknown).

## Scope

- Print-optimised themed cards (A6/A5) for all tables.
- QR to /order with quiet zone; Wi-Fi details from settings.

## Out of scope

- Printing (TICKET-160).

## Acceptance criteria

- [x] The QR on a printed card decodes to the /order URL (rasterised test).
- [x] One card per table, numbers correct (unit).

## Test plan

- Unit: Card data.
- Manual: Print one and scan it.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/admin/`

## Notes / decisions

_Agents append dated notes here while working._

- 2026-11-12 (unclechenna, claude): owner asked to build this now. The domain only changes the QR's target, which comes from `NEXT_PUBLIC_SITE_URL`, so it no longer blocks building; printing (TICKET-160) still waits on the domain (TICKET-145).
- 2026-11-13 (unclechenna, claude): cards live at `/admin/guests/seating/cards`, one A6 page each. Chromium
  ignores the `A6` page-size keyword, so the print CSS uses `105mm 148mm`. The Wi-Fi migration was regenerated
  as `0035` after develop reached `0034`. The manual print-and-scan on a real phone is still to do.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-12 — todo → claimed — unclechenna (claude)
- 2026-11-12 — todo → in_progress — unclechenna (claude)
