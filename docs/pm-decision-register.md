# PM decision register

Recorded 5 November 2026 under TICKET-216. Product authority is the complete
[approved brief](approved-requirements-2026-11-02.md), preserved verbatim from
PR #92 commit 7ea316ba4bddcfcb418e7c180c2fae03af81e618, and the subsequent
[PM execution direction](pm-direction-2026-11-05.md). Conflicting historical
PRD assumptions are superseded. Implementation state is separate from product
approval: see [phase status](pm-phase-status.md) and the
[detailed integration checklist](pm-requirements-checklist.md).

| Decision               | Approved rule and consequence                                                                                                                                                                                                                  | Source section  |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| D01 Invitation unit    | Individuals, families and groups contain distinct named adult/child members; contacts/names never automatically merge people.                                                                                                                  | Brief 2, 4      |
| D02 Guest access       | Password-free private links; opaque, invitation-scoped persistent sessions across devices, explicit expiry/revocation, no entry-QR management grant.                                                                                           | 3               |
| D03 Member selection   | Identifies a member only; cannot create guests, RSVP, check in, or verify age/identity.                                                                                                                                                        | 3               |
| D04 RSVP               | One current state per person; mixed attendance/diet, transactional constraints, request idempotency, revision conflicts and atomic change history. Count people.                                                                               | 4               |
| D05 Deadlines          | Server-enforced event-zone cutoff; late requests need approval, with household/global reopening and outstanding-response reminders.                                                                                                            | 4               |
| D06 Extra guests       | Pending requests reserve no seats and count no confirmed attendance; explicit approval creates distinct members. Equivalent venue controls apply.                                                                                              | 4, 5            |
| D07 Invitations        | Admin WhatsApp batches and manually shared distinct private links; preview imports/recipients/content and record per-recipient idempotent outcomes/retries. Never group-message recipients.                                                    | 2               |
| D08 Contact choice     | Reuse saved invitation numbers; WhatsApp optional, consent recorded, country/E.164 validation. Registration lookup is provider-dependent, not inferred from delivery errors.                                                                   | 2               |
| D09 Household arrival  | Household QR with selected individual arrivals; first confirmed arrival atomically reserves a fitting table for all confirmed members; duplicate/concurrent scans are safe.                                                                    | 5               |
| D10 Capacity           | Real configured capacity only; no silent split or overbooking. Logged admin-approved splits, moves, additions, corrections and releases; keep active-order destinations current.                                                               | 5               |
| D11 Free service       | No payment/checkout. Ordering requires check-in, a valid destination and an enabled service; food/drink service can independently open, pause or close.                                                                                        | 6               |
| D12 Recipient orders   | For self/household, checked-in recipients only, recipient-level servings/diet/limits, visible existing orders, idempotency and atomic stock reservations.                                                                                      | 6               |
| D13 Changes/stock      | Per-item edit/cancel before preparation; after preparation offer waiter help. Eligible cancellations release stock; prepared stock returns only by staff decision. Do not guarantee allergen safety.                                           | 6               |
| D14 Delivery           | Independent kitchen/bar queues; received, preparing, ready, on the way, delivered; explicit cancellation/unavailability/failure. Atomic waiter claims, item-level outcomes and reassignment.                                                   | 7               |
| D15 Alcohol            | Recipient declaration is not verification. Agreed threshold 18+, subject to venue/jurisdiction confirmation. Recorded successful staff ID check required before alcohol delivery; refusal is not delivery. No ID images/numbers.               | 8               |
| D16 Notifications      | Persist important in-app notices, reconcile retries/duplicates and provide role-specific live staff alerts. WhatsApp is optional and never blocks core workflows or substitutes for offline operation.                                         | 9               |
| D17 Staff              | Individual accounts with admin-controlled grants; admin, usher, kitchen, bar, waiter and multiple roles. Server permission checks, prompt revocation and admin two-step verification.                                                          | 10              |
| D18 Content            | Admin controls names, actual event date/time/zone, venues, programme, dress code, photos, FAQs and invitation text; important-change notifications are a choice.                                                                               | 11              |
| D19 Event truth        | Unconfirmed details are announced as pending. Prototype dates/assets are not real configuration. Countdown uses configured instant/zone, with an invalid/missing-date placeholder.                                                             | 11              |
| D20 Guest UI           | Separate code-based envelope, swipe/hold/reverse and seal opening, fresh gesture to continue, skip/keyboard/reduced motion and no mandatory repeat intro. Invitation/My Pass/Food & Drinks navigation.                                         | 12              |
| D21 Design system      | Provisional burgundy/ivory; configurable tokens/reusable components, approved photography, restrained light/glow/transitions, responsive accessible lightweight guest pages and readable staff controls. No regenerated faces/rotating couple. | 12; PM 8        |
| D22 Outages            | Honest pending/failed acknowledgements and connection state; privacy-bounded previously loaded invitation/pass caches; safe retries/reconciliation. No uncoordinated offline seating or stale mutation replay.                                 | 13              |
| D23 Manual fallback    | Logged usher fallback, one designated seating coordinator during outages, staff-assisted orders and reviewed reconciliation/duplicates/conflicts.                                                                                              | 13              |
| D24 Retention          | One year with protected cloud backups; event end is the proposed retention start pending actual event/end configuration. Bounded incident holds need reason, scope and review/release, not indefinite blanket retention.                       | 14              |
| D25 Accountability     | Actor/action/time history for RSVP, extras, admission, seating, orders/stock/delivery/ID outcomes, access, revocation, exports and overrides; minimal personal data, admin-only logged exports.                                                | 14              |
| D26 Engineering        | Server/database truth, uniqueness/FKs, transactions, idempotency, explicit transitions, permissions and reconnect reconciliation. Preserve real data and applied migration history.                                                            | 15              |
| D27 Acceptance         | Six factual phase states; only explicit PM acceptance sets PM accepted. Tests, source approval and reviewability are not launch/deployment approval.                                                                                           | PM status rules |
| D28 Execution boundary | No shared-branch merge, real guest test sends, purchases or hosted migrations. Destructive legacy execution additionally needs a reviewed target plan, verified backup and restore rehearsal.                                                  | PM boundaries   |

## Missing decisions and external inputs

- Actual venue/jurisdiction, time zone, ceremony/reception times and event end;
  distinguish confirmed owner values from fixtures before changing configuration.
- Final colours, real approved photography/content and accessible design-source assets.
  The separate subsequent UI-polish amendment referenced by the PM is not present
  among the supplied brief/direction files; preserve the known requirements above
  and obtain its exact text before claiming full amendment fidelity.
- Supported WhatsApp provider, sender/account/templates/cost approval and consent
  wording. Do not assume a registration lookup capability or acquire a service.
- Venue/jurisdiction alcohol policy and acceptable-ID operational procedure.
- Hosted database identities/applied journals, backup ownership/access/expiry,
  isolated restore target, deployment authority and target-specific legacy plan.
- Physical devices, venue connectivity, designated seating coordinator, staff
  rehearsal arrangements and operational load assumptions for review.

The register preserves approved decisions; it does not resolve these missing
inputs by inventing production values. Source preservation proof is retained in
ignored artifacts/TICKET-216/decision-source-proof.json.
