---
id: TICKET-046
title: Offer a printable PDF invitation with the QR
epic: invitations
status: in_review
priority: urgent
estimate: L
labels: [frontend, backend]
module: invitations
owner: divine
agent: codex
blocked_by: [TICKET-011, TICKET-044]
blocks: [TICKET-131, TICKET-158, TICKET-176]
branch: TICKET-046
pr: https://github.com/UncleChenna/wedding-app/pull/77
created: 2026-10-21
updated: 2026-11-03
started: 2026-11-02
completed: ""
reason: ""
resume_to: ""
---

# TICKET-046: Offer a printable PDF invitation with the QR

## Context

Some guests will print their pass; the PDF must wear the active theme.

See: [Invitations and RSVP](../docs/prd.md#invitations-and-rsvp) (INV-5) · [Tech stack and architecture](../docs/prd.md#tech-stack-and-architecture) · [How theming works](../docs/prd.md#how-theming-works) (THM-1).

## Scope

- `@react-pdf/renderer` (approved dependency) generating an A5 themed invitation with QR.
- Fonts embedded; works for long names.

## Out of scope

- Batch printing for admins.

## Acceptance criteria

- [x] The PDF opens in Preview and Chrome; its QR decodes from a 300dpi print scan or rasterisation test.
- [x] Colours and fonts follow the active theme (asserted on generated metadata).
- [x] Generation takes <2s for one invitation.

## Test plan

- Unit: PDF generation smoke test.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/invitations/server/pdf.tsx`
- `src/app/(guest)/i/[token]/invitation.pdf/route.ts`

## Notes / decisions

2026-11-02: Draft PR https://github.com/UncleChenna/wedding-app/pull/77 contains PDF implementation and review evidence. Generated pnpm-lock.yaml is excluded pending exact-path human authorization; frozen CI cannot pass until approved and committed. Ten focused tests, final build, all-theme download/privacy checks and 300dpi QR decoding pass. Full gate remains incomplete (protected-file guard; one smoke timeout passes isolated rerun). See docs/handoffs/TICKET-046.md. No acceptance criterion marked complete prematurely.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-02 — todo → claimed — divine (codex)
- 2026-11-02 — todo → in_progress — divine (codex)
- 2026-11-02 — in_progress → blocked — divine (codex) — Awaiting human exact-path authorization for generated pnpm-lock.yaml and permission to record it; implementation and review evidence preserved locally, full gate must be rerun after authorization.
- 2026-11-03 — blocked → in_progress — divine (codex) — User approved generated pnpm-lock.yaml and exact-path authorization record
- 2026-11-03 — in_progress → in_review — divine (codex)
