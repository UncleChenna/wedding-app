---
id: TICKET-236
title: Separate invitation previews from final launch approvals
epic: design-system
status: done
priority: urgent
estimate: S
labels: [docs]
module: shared
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: TICKET-236
pr: https://github.com/UncleChenna/wedding-app/pull/187
created: 2026-11-13
updated: 2026-11-13
started: 2026-11-13
completed: 2026-11-13
reason: ""
resume_to: ""
---

# TICKET-236: Separate invitation previews from final launch approvals

## Context

The approved invitation preview can be built before final photographs and domain ownership are settled. Preserve the final requirements from [Design and theming](../docs/prd.md#design-and-theming), while removing unrelated implementation dependencies.

## Scope

- Reconcile TICKET-008, 014, 038, 099, 146, 154 and 176 definitions.
- Let the approved palette and clearly identified stock previews progress independently.
- Keep final assets, rights and couple approval mandatory before release; put domain ownership evidence in the domain purchase ticket.

## Out of scope

- Product implementation, domain purchases, production deployment, or claims of human approval that have not occurred.
- Status, ownership or PR changes for the seven affected tickets.

## Acceptance criteria

- [x] TICKET-014 and TICKET-038 no longer depend on final asset/domain approval; their implementation and verification requirements remain testable.
- [x] TICKET-008 preserves final asset, rights and couple visual approval requirements; TICKET-146 owns domain ownership evidence without a dependency cycle.
- [x] TICKET-099 describes preview/final asset semantics and both release tickets directly require TICKET-008.
- [x] Ticket validation and rendering pass with unchanged affected-ticket status/ownership/PR metadata.

## Test plan

- Manual: compare the seven definitions and dependency edges against the retained requirements.
- CLI: `pnpm t:validate`, `pnpm t:render`, `pnpm verify:quick`.
- Independent review: inspect the diff for false completion claims and removed release gates.

## Files likely touched

- The seven ticket definitions above and this ticket.
- `docs/plans/TICKET-236-pr.md`.

## Notes / decisions

- 2026-11-13 — The user approved ivory/champagne/chocolate, Uchenna and Adaora, 19 December 2026, and a stock couple preview. Final photographs, domain ownership and both-partner rights approval are not inferred from that authorization.

## Activity log

- 2026-11-13 — new → todo — divine (codex)
- 2026-11-13 — todo → claimed — divine (codex)
- 2026-11-13 — todo → in_progress — divine (codex)
- 2026-11-13 — in_progress → in_review — divine (codex)
- 2026-11-13 — in_review → done — divine (codex)
