---
id: TICKET-181
title: Persist validated theme drafts and activate them atomically
epic: design-system
status: in_progress
priority: high
estimate: M
labels: [backend, security]
module: theming
owner: divine
agent: codex
blocked_by: [TICKET-012, TICKET-032, TICKET-170]
blocks: [TICKET-098]
branch: TICKET-181
pr: ""
created: 2026-10-21
updated: 2026-11-07
started: 2026-11-05
completed: ""
reason: ""
resume_to: ""
---

# TICKET-181: Persist validated theme drafts and activate them atomically

## Context

Backlog audit coverage: THM-2, THM-3, THM-6. See [PRD](../docs/prd.md) and [audit](AUDIT.md).

## Scope

- Separate theme persistence and activation from the editor controls.

## Out of scope

- Work outside the stated contract; consuming screens and launch operations remain in their linked tickets. No product implementation is part of this audit.

## Acceptance criteria

- [ ] AAL2 admin-only draft save validates the canonical schema, curated fonts and contrast with named failing pairs before persistence.
- [ ] Activate performs an atomic active-theme switch and invalidates affected server caches; concurrent activations leave exactly one active theme.
- [ ] A fresh response contains the selected variables before hydration; failed validation cannot change the live invitation, order page or generated artifacts.

## Test plan

- Integration: unauthorized saves, invalid pairs and concurrent activation. End-to-end: inspect initial HTML and artifacts after activation and verify no flash of the old theme.
- Gate: `pnpm verify`; UI work also records the design checklist at 375/768/1280 in every theme.

## Files likely touched

- src/modules/theming/server/; src/modules/shared/server/db/

## Notes / decisions

- 2026-11-07 — User-approved integration of develop205cc663 preserves outbox0013/photo0014 and regenerates theme0015. Approved isolated reset, repeat counts, 18 RLS checks and five publication DB tests pass. Full gate passes (1089 unit, 837 browser); dedicated publication rerun passes with 24 unchanged captures. PR104 remains draft pending UI disposition; no production application or merge.


- 2026-11-07 — Database recovered; five publication tests, repeated migration/counts and 16 RLS checks pass. Dedicated four-palette browser/PNG verification passes with 24 inspected captures. Full gate running; base-update proposal required for migration0013 collision. PR104 remains draft; device/performance checks unverified.

- 2026-10-21 — Added by HARNESS-002. All criteria describe future work; no completion or human approval is implied.

## Activity log

- 2026-10-21 — new → todo — divine
- 2026-11-05 — todo → claimed — divine (codex)
- 2026-11-05 — todo → in_progress — divine (codex)
- 2026-11-05 — in_progress → blocked — divine (codex) — Awaiting exact-path approval for published_tokens migration, isolated testing and commit; full gate rejects unapproved journal, database/browser activation remain unverified.
- 2026-11-05 — blocked → in_progress — divine (codex)
- 2026-11-05 — in_progress → blocked — divine (codex) — Migration approved, but owned DB unhealthy/connection timeout and VM capacity exhausted; waiting permission to stop inactive owned TICKET-048 with backup preserved. Browser gate failed; no DB publication evidence.
- 2026-11-05 — in_progress → blocked — divine (codex) — Owned database intermittently responds; approved migration exited 1 and journal remains at 13. Repeatability, RLS and publication tests did not run. Pending data-preserving capacity recovery authorization.
- 2026-11-07 — blocked → in_progress — divine (codex) — Completed TICKET-175 stack removed; owned preserved stack restarted and guarded counts now pass. Resume approved isolated migration verification.
- 2026-11-07 — Full verification passed: 1046 unit passes/101 skips, 837 browser passes/189 skips; format/lint/types/build pass. Integration approval remains pending; PR104 stays draft.
- 2026-11-07 — in_progress → blocked — divine (codex) — Awaiting approval of docs/reviews/TICKET-181/base-update-proposal.md: reconcile locally applied migration 0013 as 0015 and reset only the isolated test database. Full branch verification passes; PR104 remains draft.
- 2026-11-07 — blocked → in_progress — divine (codex)
- 2026-11-07 — in_progress → blocked — divine (codex) — Approved integration complete; all five CI checks passed at 53963aab. Awaiting preview-review disposition for fresh Lighthouse/CLS and physical-device requirements retained in TICKET-201. PR104 remains draft; no merge authorization.
