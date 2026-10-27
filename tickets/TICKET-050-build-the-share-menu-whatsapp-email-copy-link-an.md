---
id: TICKET-050
title: "Build the Share menu: WhatsApp, email, copy link and native share"
epic: sharing
status: in_progress
priority: urgent
estimate: M
labels: [frontend]
module: admin
owner: divine
agent: codex
blocked_by: [TICKET-018, TICKET-036, TICKET-049]
blocks: [TICKET-048, TICKET-051, TICKET-052, TICKET-089, TICKET-134, TICKET-154, TICKET-176]
branch: TICKET-050
pr: ""
created: 2026-10-21
updated: 2026-10-27
started: 2026-10-27
completed: ""
reason: ""
resume_to: ""
---

# TICKET-050: Build the Share menu: WhatsApp, email, copy link and native share

## Context

INV-3: each IV is shared from the couple's own WhatsApp or email with no paid provider.

See: [Invitations and RSVP](../docs/prd.md#invitations-and-rsvp) (INV-3) · [Journey 1: receiving the IV and RSVP](../docs/prd.md#journey-1-receiving-the-iv-and-rsvp).

## Scope

- wa.me/<number>?text=… (or wa.me/?text=… without a number).
- mailto: with subject and body filled.
- Copy link (Clipboard API with fallback) and `navigator.share` on phones.
- Bottom sheet on mobile.

## Out of scope

- Message wording (TICKET-052), sent tracking (TICKET-051).

## Acceptance criteria

- [ ] Generated wa.me and mailto URLs are correctly encoded (unit, including emoji and line breaks).
- [ ] Native share appears only when supported; copy shows a confirmation toast.
- [ ] Works by keyboard and at 375px (e2e).

## Test plan

- Unit: URL builders.
- End-to-end: Menu opens; copy writes to clipboard.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/admin/components/share-menu.tsx`
- `src/modules/invitations/lib/share.ts`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-27 — todo → claimed — divine (codex)
- 2026-10-27 — todo → in_progress — divine (codex)
