---
id: TICKET-110
title: Add an iOS Add to Home Screen guide
epic: pwa
status: in_progress
priority: medium
estimate: S
labels: [pwa, frontend]
module: shared
owner: divine
agent: codex
blocked_by: [TICKET-103]
blocks: [TICKET-113]
branch: TICKET-110
pr: ""
created: 2026-10-21
updated: 2026-11-01
started: 2026-11-01
completed: ""
reason: ""
resume_to: ""
---

# TICKET-110: Add an iOS Add to Home Screen guide

## Context

iOS has no install prompt; a short guide explains Share → Add to Home Screen.

See: [Design principles](../docs/prd.md#design-principles).

## Scope

- Detect iOS Safari not in standalone; bottom-sheet guide with illustrations from tokens.
- Note for WhatsApp in-app browser: open in Safari first.

## Out of scope

- Android.

## Acceptance criteria

- [x] Guide shows on iOS Safari UA and not in standalone mode (unit).
- [ ] In WhatsApp's browser it explains opening in Safari (manual).

## Test plan

- Unit: Detection.
- Manual: iPhone check.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/shared/components/`

## Notes / decisions

- 2026-11-01: Detection criterion verified with13 unit cases;28 guide browser cases pass using UA fixtures. Actual iPhone/WhatsApp criterion remains unchecked. PR66 is draft; local full gate has invitation focus failures and hosted CI has an Emerald Night envelope CLS failure. Review: docs/reviews/TICKET-110/README.md.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-01 — todo → claimed — divine (codex)
- 2026-11-01 — todo → in_progress — divine (codex)
- 2026-11-01 — in_progress → blocked — divine (codex) — Draft PR66: local full gate has six invitation focus failures (isolated rerun passes); CI41270521817 fails Emerald Night envelope zero-CLS; real iPhone/WhatsApp manual criterion remains unverified. Keep assertions and release gates intact.
- 2026-11-01 — blocked → in_progress — divine (codex) — Resume after verified font and Android-install merges; preserve both controls and validate combined UI
