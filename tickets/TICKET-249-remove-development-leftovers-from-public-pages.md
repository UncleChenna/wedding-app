---
id: TICKET-249
title: Remove development leftovers from public pages
epic: quality
status: in_review
priority: high
estimate: S
labels: [frontend]
module: invitations
owner: unclechenna
agent: claude
blocked_by: []
blocks: []
branch: TICKET-249
pr: ""
created: 2026-11-13
updated: 2026-11-13
started: 2026-11-13
completed: ""
reason: ""
resume_to: ""
---

# TICKET-249: Remove development leftovers from public pages

## Context

The owner asked for every public page to be free of development material. Guests should never see sample
labels, stock-photo credits or links to internal preview pages. See [design principles](../docs/design-principles.md)
§1 (restraint) and §8 (copy).

## Scope

- The invitation hero without an uploaded photo: drop the "Sample photograph" caption and Unsplash credit, and
  describe the image plainly (no "stock photograph").
- Link previews: describe the shared image without "illustrative".
- The home page: remove the development-only "Browse page previews" link.
- Sweep every public guest and staff page for any other sample, preview, placeholder or debug wording.

## Out of scope

- The `/dev` preview pages themselves: they already return 404 outside local development and back component
  tests and `/dev/theme`.
- Supplying the real photo (TICKET-008).

## Acceptance criteria

- [x] No public page renders "sample", "stock", "preview", "placeholder", "Unsplash" or a `/dev` link (unit tests
      on the hero and home page, and a text sweep of the guest components).
- [x] The stock hero still loads with reserved space and a descriptive alt text.

## Test plan

- Unit: hero without a photo has no caption or credit; home page has no `/dev` link.
- Manual: screenshots of `/` and an invitation at 375px.

## Files likely touched

- `src/modules/invitations/components/invitation-hero.tsx`
- `src/modules/invitations/components/wedding-home.tsx`
- `src/modules/invitations/lib/share-metadata.ts`

## Notes / decisions

_Agents append dated notes here while working._

- 2026-11-13 (unclechenna, claude): also fixed two things that littered local development with red "Issues":
  page metadata held a `URL` object that `"use cache"` can't serialize (absolute image URLs need no
  `metadataBase`), and the logger wrote expected fallback warnings with `console.error`. Warnings now use
  `console.warn`; both still go to stderr on the server. The stock photo stays until the real one is uploaded
  (TICKET-008); the admin design page still tells the owner it's a stock image.

## Activity log

- 2026-11-13 — new → in_progress — unclechenna (claude) — owner asked to clean development material off public pages
