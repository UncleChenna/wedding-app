---
id: TICKET-110
title: Add an iOS Add to Home Screen guide
epic: pwa
status: done
priority: medium
estimate: S
labels: [pwa, frontend]
module: shared
owner: divine
agent: codex
blocked_by: [TICKET-103]
blocks: [TICKET-113]
branch: TICKET-110
pr: https://github.com/UncleChenna/wedding-app/pull/66
created: 2026-10-21
updated: 2026-11-01
started: 2026-11-01
completed: 2026-11-01
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
- [x] Browser fixtures verify Safari-first instructions for WhatsApp-marked and Safari-like iOS user agents; physical iPhone/WhatsApp validation remains an unchecked release requirement in TICKET-201 and the installation suite in TICKET-114.

## Test plan

- Unit: Detection.
- Manual: iPhone check.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/shared/components/`

## Notes / decisions

- 2026-11-01: Integrated develop0397748c5c9aa4707384a3ebce6ef7bf4d0907ba, retaining Android and iOS controls. Full local verification passes547unit/26skipped and659browser/135skipped; twelve guide screenshots inspected and36 combined-control combinations pass keyboard, accessibility and layout checks. Under the owner's standing preview/device-QA separation approval, the physical WhatsApp check remains explicit and unchecked in201/114. No real-device pass is claimed.

- 2026-11-01: Detection criterion verified with13 unit cases;28 guide browser cases pass using UA fixtures. Actual iPhone/WhatsApp criterion remains unchecked. PR66 is draft; local full gate has invitation focus failures and hosted CI has an Emerald Night envelope CLS failure. Review: docs/reviews/TICKET-110/README.md.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-01 — todo → claimed — divine (codex)
- 2026-11-01 — todo → in_progress — divine (codex)
- 2026-11-01 — in_progress → blocked — divine (codex) — Draft PR66: local full gate has six invitation focus failures (isolated rerun passes); CI41270521817 fails Emerald Night envelope zero-CLS; real iPhone/WhatsApp manual criterion remains unverified. Keep assertions and release gates intact.
- 2026-11-01 — blocked → in_progress — divine (codex) — Resume after verified font and Android-install merges; preserve both controls and validate combined UI
- 2026-11-01 — in_progress → in_review — divine (codex)
- 2026-11-01 — in_review → done — divine (codex)
