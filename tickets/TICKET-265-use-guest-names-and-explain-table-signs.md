---
id: TICKET-265
title: Use guest names and clarify printable table signs
epic: admin
status: in_review
priority: high
estimate: L
labels: [frontend, backend]
module: admin
owner: UncleChenna
blocked_by: []
blocks: []
branch: TICKET-265
pr: "https://github.com/UncleChenna/wedding-app/pull/231"
created: 2026-11-16
updated: 2026-11-16
---

# TICKET-265: Use guest names and clarify printable table signs

## Context

Owner wants household fields removed and seating/cards explained. Confirmed that each guest
and their plus-one keep one invitation and sit together.

## Scope

Stop collecting/saving household labels in guest editing/import. Use guest names in seating,
sharing and guest-facing material. Keep invitation-level RSVP/table grouping. Existing nullable
legacy column remains for non-destructive compatibility; no deletion of real data is included.
Explain /admin/guests/seating/cards as reception table signs for ordering, not invitations or
place cards. Make print setup and the shared QR/table-selection flow explicit.

## Acceptance criteria

- [x] Guest create/edit/import no longer collects or saves household names.
- [x] Seating uses guest names, with guest and plus-one seated together.
- [x] Table signs explain printing, placing on tables and scanning/choosing a table.
- [x] Guest workflows, contacts validation, imports and assignment capacity checks still work.

## Test plan

Targeted form/import/repository tests, full verification, mobile/tablet/desktop screenshots and
browser checks for seating and printable signs. No production database mutation.
