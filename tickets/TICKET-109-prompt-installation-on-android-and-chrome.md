---
id: TICKET-109
title: Prompt installation on Android and Chrome
epic: pwa
status: in_progress
priority: medium
estimate: M
labels: [pwa, frontend]
module: shared
owner: divine
agent: codex
blocked_by: [TICKET-103]
blocks: [TICKET-113]
branch: TICKET-109
pr: ""
created: 2026-10-21
updated: 2026-11-01
started: 2026-10-31
completed: ""
reason: ""
resume_to: ""
---

# TICKET-109: Prompt installation on Android and Chrome

## Context

Installing keeps the pass and scanner one tap away.

See: [Design principles](../docs/prd.md#design-principles).

## Scope

- Capture beforeinstallprompt; show a restrained install button on the pass and staff pages.
- Never on first paint; dismiss remembered.

## Out of scope

- iOS (TICKET-110).

## Acceptance criteria

- [x] The button appears only when beforeinstallprompt fired (unit with a stub event).
- [x] Dismissal persists for 30 days.

## Test plan

- Unit: Prompt state.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/shared/components/install-prompt.tsx`

## Notes / decisions

- 2026-11-01: Integrated develop3dae6a38946ddc3419363fb18ed688670d0d02c3. Full local verification passes:534unit/26skipped,631browser/135skipped. CI41289827331 passes all four jobs. Serial production performance90/92/90 remains below95; accessibility100 and CLS0 each. Explicit unresolved performance/native-device checks remain in201/114 under the owner's approved preview delivery exception.

- 2026-11-01: Eight unit and14 browser cases pass; full local gate522 unit/575 browser passed. PR65 remains draft pending review of performance86/91/92 and unverified native-device/WhatsApp checks. See docs/reviews/TICKET-109/README.md. Criteria above cover stub-tested behavior, not native installation certification.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-31 — todo → claimed — divine (codex)
- 2026-10-31 — todo → in_progress — divine (codex)
- 2026-11-01 — in_progress → blocked — divine (codex) — Draft PR65: hosted CI fails envelope zero-CLS checks in Midnight and Emerald; invitation performance86/91/92 is below95 and native device checks remain unverified. Preserve failing evidence; fix shared font regression before review.
- 2026-11-01 — blocked → in_progress — divine (codex) — Resume after merged font fix and icon assets; verify integration and retain physical-device release gates
