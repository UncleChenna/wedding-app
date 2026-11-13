---
id: TICKET-120
title: Set metadata and keep private pages out of search engines
epic: quality
status: done
priority: urgent
estimate: S
labels: [frontend, security]
module: shared
owner: unclechenna
agent: claude
blocked_by: [TICKET-047]
blocks: [TICKET-154, TICKET-176]
branch: TICKET-120
pr: https://github.com/UncleChenna/wedding-app/pull/111
created: 2026-10-21
updated: 2026-11-08
started: 2026-11-08
completed: ""
reason: ""
resume_to: ""
---

# TICKET-120: Set metadata and keep private pages out of search engines

## Context

Personal invitation pages, staff and admin must never be indexed; shared links still need good previews.

See: [Design principles](../docs/prd.md#design-principles) · [Privacy (UK GDPR)](../docs/prd.md#privacy-uk-gdpr).

## Scope

- robots: noindex on /i, /p, staff and admin; robots.txt; titles per route.

## Out of scope

- SEO for discovery (not wanted).

## Acceptance criteria

- [x] Every private route returns noindex (e2e header/meta check).
- [x] robots.txt disallows staff and admin.

## Test plan

- End-to-end: Meta and robots checks.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/app/robots.ts`
- `src/app/`

## Notes / decisions

_Agents append dated notes here while working._

- 2026-11-08 (unclechenna, claude):
  - **robots.txt doesn't block `/i` or `/p`.** A block would stop link-preview crawlers reading the Open Graph tags
    that TICKET-047 adds, so those pages use the noindex header instead.
  - **Started ahead of TICKET-047,** which only touches invite-link previews.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-08 — todo → claimed — unclechenna (claude) — started ahead of TICKET-047 (blocked)
- 2026-11-08 — todo → in_progress — unclechenna (claude) — started ahead of TICKET-047 (blocked)
- 2026-11-08 — in_progress → in_review — unclechenna (claude)
