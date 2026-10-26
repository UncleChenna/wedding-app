---
id: TICKET-198
title: Build the home page and invitation frontend preview
epic: invitations
status: in_review
priority: urgent
estimate: M
labels: [frontend, design]
module: invitations
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: TICKET-198
pr: https://github.com/UncleChenna/wedding-app/pull/30
created: 2026-10-26
updated: 2026-10-26
started: 2026-10-26
completed: ""
reason: ""
resume_to: ""
---

# TICKET-198: Build the home page and invitation frontend preview

## Context

The user cannot navigate or review guest pages because routes contain placeholders. See docs/prd.md (INV-1–6), docs/design-principles.md and the invitation spike findings. This is the presentation-only slice of TICKET-037; token validation, persisted settings and real RSVP remain in their existing tickets.

## Scope

- Replace the generic home placeholder with a wedding welcome and clear personal-invitation guidance.
- Build a reusable invitation presentation and a clearly labelled sample at /dev/invitation.
- Add /dev navigation to implemented pages and explicitly labelled pending routes.
- Record the next frontend screen tickets and keep TICKET-015 paused.

## Out of scope

- Real invitation tokens, saving RSVPs, unconfirmed production event details, staff authentication, live orders or claiming blocked integration tickets complete.

## Acceptance criteria

- [x] Home and invitation guidance are navigable, with no fake event details or submission claims on public routes.
- [x] Invitation preview shows confirmed names/date, sample venue, dress code, photograph and an honest RSVP handoff using PRD copy.
- [x] Preview navigation distinguishes available UI from pending screens; both themes and 375/768/1280 are reviewed.
- [x] Keyboard, accessibility, long-name wrapping and navigation tests pass; quick/full verification passes.

## Test plan

- End-to-end: home to invitation guidance; preview navigation; map link; 80-character names; axe; screenshots in all themes at three widths.
- Gate: pnpm verify:quick and pnpm verify.
- Review: no private data, fabricated RSVP persistence or staff access.

## Files likely touched

- src/modules/invitations/components/, src/app/(guest)/, src/app/dev/, e2e/
- docs/frontend-delivery.md, ticket definitions, per-ticket review evidence.

## Notes / decisions

- New pages reuse existing fonts/tokens. TICKET-015 is not resumed and TICKET-037 remains blocked for its full production contract.

- 2026-10-26 — User confirmed Uchenna and Adaora, 19 December 2026. Venue/time remain pending; preview photograph and venue are explicitly samples.

- 2026-10-26 — Loading follow-up passes quick/full gates; see review for performance variance and unverified device QA. PR remains draft; preview-only exception question is pending.

## Activity log

- 2026-10-26 — new → todo — divine
- 2026-10-26 — todo → claimed — divine (codex)
- 2026-10-26 — todo → in_progress — divine (codex)
- 2026-10-26 — in_progress → in_review — divine (codex)
- 2026-10-26 — in_review → in_progress — divine (codex) — Finish performance evidence and review readiness before continuing frontend delivery
