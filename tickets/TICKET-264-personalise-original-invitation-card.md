---
id: TICKET-264
title: Personalise the supplied invitation card and preview before sharing
epic: invitations
status: in_review
priority: high
estimate: L
labels: [frontend, backend]
module: invitations
owner: UncleChenna
blocked_by: []
blocks: []
branch: TICKET-264
pr: ""
created: 2026-11-15
updated: 2026-11-15
---

# TICKET-264: Personalise the supplied invitation card and preview before sharing

## Context

Owner supplied YOUR INVITE 🌸.pdf and explicitly chose to preserve its artwork while
personalising the printed number and replacing phone/SMS RSVP with online RSVP.

## Scope

Original artwork on personal invitations and sample preview, stable per-household card numbers,
private downloadable card before RSVP, and authenticated admin preview including drafts.
Existing entry-pass PDF and QR remain separate. Source card states 19 December 2026, noon at
St Paul's Anglican Church, Apo Resettlement, Abuja; reception 2:30pm at Fineworld Recreational
Park, Events & Gardens, opposite AYM Shafa fuel station, Apo Resettlement, Abuja.
Reply requested by 17 December; this is a requested reply date, not a new lock policy.

## Acceptance criteria

- [x] Source artwork is preserved apart from personalised number/RSVP overlays.
- [x] Each invitation has a permanent unique number, stable across link reissues/deletions.
- [x] Published guests can download their card before replying; drafts/revoked links fail closed.
- [x] Admin can preview/download a draft without publishing or recording a share.
- [x] Guest preview and PDF use the same number and capacity; RSVP points to that household.
- [x] Mobile preview is readable through an accessible details companion and online RSVP link.

## Test plan

Migration constraints/repeat application; resolver/status/URL tests; PDF structure and QR;
375/768/1280 browser previews, admin/guest access; full verification.

## Evidence

See `docs/reviews/TICKET-264/card-review.md` and `card-number-migration.md`.
