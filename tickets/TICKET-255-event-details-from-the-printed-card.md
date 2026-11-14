---
id: TICKET-255
title: Use the event details from the printed card
epic: invitations
status: in_review
priority: high
estimate: M
labels: [frontend, backend, database]
module: invitations
owner: "UncleChenna"
agent: ""
blocked_by: []
blocks: [TICKET-256, TICKET-257]
branch: "TICKET-255"
pr: ""
created: 2026-11-13
updated: 2026-11-14
started: 2026-11-13
completed: ""
reason: ""
resume_to: ""
---

# TICKET-255: Use the event details from the printed card

## Context

The printed invitation card fixes the day: church service at 12:00 pm at St Paul's Anglican Church,
Apo Resettlement, Abuja; reception at 2:30 pm at Fineworld Recreational Park, Events & Gardens,
opposite AYM Shafa fuel station, Apo Resettlement, Abuja. Printed-card guests RSVP by call or text to
09160665114 by 17 December, quoting the card number. The site still showed "to follow" for all of this
and had nowhere to keep a reception or an RSVP phone number.

## Scope

- Event settings gain reception time, reception venue, reception map link and RSVP phone number; the
  card's details become the defaults, including the 17 December 23:59 (Lagos) RSVP cutoff.
- A data migration fills only blank church, time zone and cutoff fields on an existing settings row.
- Admin Settings edits the new fields, with church and reception labelled separately.
- Home page, personal invitation and invitation PDF show the church service and reception separately;
  the home page tells printed-card guests how and by when to RSVP.

## Out of scope

- Card numbers, phone RSVPs recorded by admin and gate lookup by card number (TICKET-256).
- The card-inspired default theme (TICKET-257).

## Acceptance criteria

- [x] With no saved settings, the home page and invitation show the card's times and venues.
- [x] Admin can change or clear each new field; cleared fields show "to follow".
- [x] Saved admin values are never overwritten by the migration.
- [x] Map links are only shown for HTTPS URLs.

## Test plan

- Unit: event settings defaults, public projection, home page, invitation letter.
- End-to-end: invitation letter specs updated for the new labels.
- Manual: home page and invitation at 375/768/1280.

## Activity log

- 2026-11-14 — in_progress → in_review — PR opened
