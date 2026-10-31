---
id: TICKET-040
title: Build the RSVP form for attending yes or no
epic: invitations
status: in_progress
priority: urgent
estimate: M
labels: [frontend, backend]
module: invitations
owner: divine
agent: codex
blocked_by: [TICKET-018, TICKET-023, TICKET-036, TICKET-025, TICKET-035]
blocks: [TICKET-041, TICKET-044, TICKET-126, TICKET-178, TICKET-183]
branch: TICKET-040
pr: ""
created: 2026-10-21
updated: 2026-10-31
started: 2026-10-28
completed: ""
reason: ""
resume_to: ""
---

# TICKET-040: Build the RSVP form for attending yes or no

## Context

Guests confirm attendance from their IV; the buttons and responses use the PRD's wording.

See: [Invitations and RSVP](../docs/prd.md#invitations-and-rsvp) (INV-4) · [Journey 1: receiving the IV and RSVP](../docs/prd.md#journey-1-receiving-the-iv-and-rsvp) · [On the website](../docs/prd.md#on-the-website).

## Scope

- "Count me in" / "I'll be there in spirit" with confirmation states from the PRD.
- Server action with Zod validation; invitation status becomes rsvp_yes or rsvp_no.
- Works without JavaScript (progressive enhancement).

## Out of scope

- Tag-alongs (TICKET-041), editing lock (TICKET-042).

## Acceptance criteria

- [ ] Submitting yes/no updates the invitation status and shows the PRD confirmation copy.
- [ ] Invalid or revoked tokens cannot submit (server-side check, tested).
- [ ] Form works with JavaScript disabled (e2e).

## Test plan

- Unit: RSVP action validation.
- End-to-end: Yes and no paths.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/invitations/components/rsvp-form.tsx`
- `src/modules/invitations/server/rsvp.ts`

## Notes / decisions

2026-10-30: Draft PR55 (https://github.com/UncleChenna/wedding-app/pull/55), implementation ec8855e pushed. Five isolated DB checks and six browser checks passed before final POST-routing cleanup; latest quick gate passes. Full build/browser/UI verification remains pending exact-path compiler-cache recovery approval. See docs/handoffs/TICKET-040.md; no completion claimed.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-28 — todo → claimed — divine (codex)
- 2026-10-28 — todo → in_progress — divine (codex)
- 2026-10-30 — in_progress → blocked — divine (codex) — Draft PR55 https://github.com/UncleChenna/wedding-app/pull/55; awaiting exact-path compiler-cache recovery approval, then final build/browser/UI verification
- 2026-10-31 — blocked → in_progress — divine (codex)
