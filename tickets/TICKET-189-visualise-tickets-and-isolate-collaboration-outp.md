---
id: TICKET-189
title: Visualise tickets and isolate collaboration outputs
epic: foundations
status: in_progress
priority: urgent
estimate: L
labels: [infra, frontend, test]
module: harness
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: TICKET-189
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: 2026-10-21
completed: ""
reason: ""
resume_to: ""
---

# TICKET-189: Visualise tickets and isolate collaboration outputs

## Context

The shared progress log and generated boards caused repeated PR conflicts. See docs/tickets.md and docs/collaboration.md. Provide a separate local visual dashboard without exposing project tracking on the wedding site.

## Scope

- Read-only standalone board with search, filters, ticket details and ledger freshness.
- Generate ignored dashboard/Markdown snapshots; keep tracked board links stable.
- Per-ticket handoffs and scoped status persistence; derive reverse dependencies without rewriting other tickets.

## Out of scope

- Public hosting, drag-and-drop mutations, GitHub merge automation, or changing existing product UI.

## Acceptance criteria

- [ ] Dashboard shows every status, filters tickets and opens accessible ticket details with safe PR links.
- [ ] Live ledger overlays file state; offline fallback is clearly identified.
- [ ] Rendering and read commands leave tracked files unchanged; status changes touch only the assigned ticket.
- [ ] Handoff guidance for all agents uses per-ticket files and preserves historical progress.
- [ ] Unit, CLI and browser regression tests pass; review at 375/768/1280 in both themes.

## Test plan

- Unit/CLI: read-only rendering, live overlay, escaping, unrelated-file preservation and derived dependencies.
- Playwright: filters, details, keyboard, empty results, theme switch and responsive screenshots.
- Gate: pnpm verify:quick and pnpm verify.

## Files likely touched

- scripts/tickets/, scripts/tickets.ts, scripts/__tests__/
- docs/tickets.md, AGENTS.md, .agents/skills/, tickets/BOARD.md, tickets/ROADMAP.md

## Notes / decisions

- Local read-only dashboard; no new dependency or public endpoint.

## Activity log

- 2026-10-21 — new → todo — divine (codex)
- 2026-10-21 — todo → claimed — divine (codex)
- 2026-10-21 — todo → in_progress — divine (codex)
