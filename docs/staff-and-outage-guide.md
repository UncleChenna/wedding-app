# Staff operating and outage guide — implementation draft

The gate, seating, kitchen/bar and waiter application workflows are not yet operational. This document must not be used as evidence that a button or role exists. Final training/rehearsal follows implementation and owner/device confirmation.

## Current safe fallback contract

During an outage, one designated seating coordinator owns assignments against a controlled capacity ledger. Ushers record invitation/member identity, arrival time, staff identity and any approval/correction on the approved fallback list. Never independently allocate seats from stale scanner copies or silently split a household. Unknown extra arrivals need an explicit authorized approval; a selector or QR scan is not age/identity verification.

Record tentative actions separately from confirmed application actions. On reconnect, reconcile duplicates/conflicts with the coordinator before replaying anything. Do not blindly replay seating, stock, prepared-item cancellation, delivery or alcohol outcomes. Waiters can assist disconnected guests; WhatsApp is not an offline fallback and a missing notification never establishes that an order was not accepted.

Alcohol requires the intended recipient's successful staff ID-check outcome at delivery, under confirmed venue/jurisdiction rules; self-declared18+ is not verification. Record outcome/staff/time/reason, never ID photos or document numbers. Refusals and absent guests must not become Delivered. These controls still need implementation before live service.

## Pre-event owner checklist

Name the admin, usher lead, seating coordinator, kitchen lead, bar lead, waiter lead and technical on-call; confirm individual account grants/revocation, supported devices, router/backup power and printed guest/capacity/menu information. Rehearse partial arrivals, over-capacity groups, last-stock orders, competing claims, alcohol refusal, loss/replacement of guest links and backup restoration. Freeze only after the agreed hosted/device/network gates pass.
