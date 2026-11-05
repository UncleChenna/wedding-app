# Approved requirements and integrated evidence checklist

Authority: the complete [approved brief](approved-requirements-2026-11-02.md)
and [PM direction](pm-direction-2026-11-05.md). This checklist preserves detailed
rules; the full brief remains authoritative if wording is abbreviated here.
See the [decision register](pm-decision-register.md) and separate
[phase status](pm-phase-status.md).

A box records verification on the eventual integrated commit, with a linked
result and exact SHA; it does not mean PM acceptance. Unchecked does not mean
existing code is absent or should be rebuilt. Inspect/reuse the existing source
and historical evidence first. No final integrated commit is verified yet.

## 1. Inspection, preservation and acceptance

- [ ] R01 Inventory current branches, uncommitted work, architecture, auth, migrations and tests; distinguish historical audit findings from present source.
- [ ] R02 Preserve useful code, existing real data, user audit/photography and both branches' intent; new scope is an explicit proposal.
- [ ] R03 Record full source SHA, actual checks/skips/failures, phase status and explicit PM acceptance separately; automated counts never imply wedding readiness.

## 2. Invitations, contacts and delivery

Reuse: invitation tokens, sharing previews and TICKET-211 classification/data foundations. Full administration/provider workflows require inspection and integration.

- [ ] I01 Individuals, families and groups support distinct named adults/children with independent attendance and dietary requirements.
- [ ] I02 Private invitation belongs to one individual/household/group and can include multiple members; shared names/contact details never automatically merge people.
- [ ] I03 Admin manual number entry and spreadsheet import preview recipients/content/changes before applying; flag missing fields and possible duplicates.
- [ ] I04 Batch sending uses a supported WhatsApp API, personalised distinct private links and no recipient-exposing group messages.
- [ ] I05 Persist per-recipient queue/sending/delivery outcomes, prevent accidental duplicate sends and support reviewed corrections/controlled retries.
- [ ] I06 Save the invitation recipient number and reuse it; existing guests are not asked to supply it again.
- [ ] I07 Admin can create/copy a distinct manually shared link; optional guest WhatsApp entry/consent does not restrict non-WhatsApp access.
- [ ] I08 Validate country code/phone format; provider capability establishes registration only when supported, never infer it from delivery failure.
- [ ] I09 Review provider capabilities, templates, setup, costs and consent; obtain applicable permission before automated sends. No scraping/unofficial automation or real guest test messages.

## 3. Guest access, sessions and recovery

Reuse: TICKET-212's encrypted codec and fresh identity repository/service. Those helpers are not browser persistence.

- [ ] A01 Private invitation opens without password or mandatory account, exchanges into a scoped device session and avoids tokens/PII in analytics, logs or third-party requests.
- [ ] A02 Session persists through reload/browser restart within explicit lifetime; several household devices independently remain authorised.
- [ ] A03 Current status/version is checked; URL/member-ID substitution cannot expose another invitation. Session payload has no names/contact/private-link token.
- [ ] A04 Member selection creates no guest, attendance, admission or identity/age verification.
- [ ] A05 Authorised link replacement/revocation invalidates old links and derived sessions while preserving RSVP, seating and order records.
- [ ] A06 Staff authentication is separate; scanning an entry QR never grants household management access.
- [ ] A07 Usher recovery finds/verifies the correct invitation, admits appropriate members, restores access through a scoped staff workflow and audits sensitive actions.
- [ ] A08 Rate limits/abuse controls protect exchange and access without blocking ordinary arrivals; useful recovery/error states remain available.

## 4. Per-person RSVP

Reuse: current aggregate form and newer party/cutoff/history behavior plus TICKET-211's member transactions. Reconcile both; do not replace either wholesale.

- [ ] R04 One current RSVP per invited person; a representative can submit mixed attendance/dietary notes for multiple members. Totals count people.
- [ ] R05 Returning guests see saved responses and an edit action; updates retain before/after history.
- [ ] R06 Database uniqueness, transactions and request idempotency prevent duplicate people/responses under taps, refresh, retry and simultaneous submissions.
- [ ] R07 Concurrent edits reject silent overwrites and present a refresh/review path; retry after acknowledgement loss replays safely.
- [ ] R08 Extra guests remain pending until admin decision, count no confirmed attendance and reserve no seating; approval creates distinct members with RSVP state.
- [ ] R09 Equivalent approved-extra/plus-one controls apply at arrival; no silent admission or member creation from selecting a person.
- [ ] R10 Admin configures deadline in the event zone; server enforces before/after boundary and late-change approval.
- [ ] R11 Household/global reopening and outstanding-response reminders respect authorised overrides and enabled channels.
- [ ] R12 Confirmation shows each member's attendance/diet, pending extras, invitation/pass navigation and table assignment only after check-in.

## 5. Check-in and seating

Reuse: household signing/pass and existing admission foundations; coordinate other ticket ownership before implementing shared storage.

- [ ] C01 Household/group QR resolves authorised members; ushers choose actual arrivals and later members can arrive separately.
- [ ] C02 Repeat/concurrent scans cannot duplicate admissions or seat reservations.
- [ ] C03 First confirmed arrival atomically selects sufficient real table capacity and reserves all confirmed attending members; later arrivals join that table.
- [ ] C04 No silent split, invented seats or overbooking. Insufficient capacity has an explicit reviewed resolution.
- [ ] C05 Admin controls table count/capacity, real additions, reassignment, approved splits/extras and logged reservation release/corrections.
- [ ] C06 Capacity cannot drop below commitments without resolving conflicts; active-order delivery destinations update and flag table changes.

## 6. Free ordering, recipients, stock and service

Reuse: merged menu, table ordering/submission/routing and limits foundations; inspect their compatibility before adding recipient/check-in requirements.

- [ ] O01 All food/drink/alcohol is free; no checkout, card collection, payment request or integration.
- [ ] O02 Ordering requires confirmed check-in, valid seating/delivery destination and the applicable enabled service.
- [ ] O03 Self/household choice assigns each serving to intended checked-in recipients; existing household orders remain visible to reduce duplicates.
- [ ] O04 Carry per-recipient dietary notes and configurable serving limits with logged staff exceptions.
- [ ] O05 Food and drinks independently open/pause/close with clear messages; pausing does not cancel existing orders.
- [ ] O06 Menu categories/items, availability, quantities, confirmed ingredients/allergens and sold-out controls are configurable; never guarantee allergen safety.
- [ ] O07 Acceptance atomically reserves stock without concurrent overselling; eligible cancellation releases reservations.
- [ ] O08 Prepared items return to availability only by explicit staff decision.
- [ ] O09 Per-item edit/cancel is allowed until preparation; afterwards offer waiter help. Food/drink items transition independently.
- [ ] O10 Submission retries are idempotent and show honest server acknowledgement, pending or failed state.

## 7. Queues, delivery and waiter help

- [ ] W01 Guest progression is Received, Preparing, Ready, On the way, Delivered; cancellation, unavailability and failed delivery have useful reasons/alternatives.
- [ ] W02 Separate kitchen/bar queues and server-authorised staff transitions do not expose unrelated role controls.
- [ ] W03 Waiter claims are atomic; two staff cannot claim identical work. Show table, recipients, items and relevant dietary notes.
- [ ] W04 Deliver items independently, allow separate food/drink arrivals, record absent/failed delivery and allow authorised reassignment.
- [ ] W05 Waiter requests link guest/table, combine repeat open requests, acknowledge/resolve and escalate unresolved requests.

## 8. Alcohol controls

- [ ] L01 Recipient age declaration is not verification; agreed 18+ threshold still requires venue/jurisdiction confirmation before live service.
- [ ] L02 Every alcohol serving identifies its recipient, including household orders; one representative's check cannot approve everyone.
- [ ] L03 Staff visually checks acceptable ID and records successful outcome, staff member and timestamp before delivery can be confirmed.
- [ ] L04 Refusal/failed verification is recorded with a reason and never marked delivered.
- [ ] L05 No ID photographs/document numbers; avoid exact birth dates when declaration/outcome suffices.

## 9. Notifications and reconnect

- [ ] N01 Important in-app notifications persist for RSVP/approved changes, extra decisions, event reminders/changes, table changes and relevant order issues.
- [ ] N02 Detailed order progress stays in-app; WhatsApp is optional, consent-based and never blocks RSVP/admission/ordering/delivery.
- [ ] N03 Role-appropriate staff alerts cover kitchen/bar work, ready deliveries, waiter requests and urgent operations.
- [ ] N04 Retries/deduplication and live-state reconciliation recover after reconnect; WhatsApp is not an offline fallback.

## 10. Staff/admin identity and operations

Reuse: existing staff sign-in/device/grant and admin OTP/TOTP foundations; inspect multiple-role and revocation behavior before extending them.

- [ ] S01 Individual admin, usher, kitchen, bar and waiter accounts support multiple roles with admin-controlled invitations/grants.
- [ ] S02 Server checks every permission; revoking access invalidates active access promptly. Admin requires two-step verification.
- [ ] S03 Dashboard shows invitations/RSVPs, pending extras/late changes, arrivals, reserved/occupied/available seats and table capacity.
- [ ] S04 Dashboard shows active/delayed orders, waiter requests, stock/sold-out state, separate service controls, staff roles, important history and invitation-send outcomes.

## 11. Event content and countdown

- [ ] E01 Admin updates names, event date/time/zone, venues, programme, dress code, photos, FAQs and relevant invitation content.
- [ ] E02 Important content changes offer an explicit notification choice.
- [ ] E03 Unconfirmed details remain pending; fixtures/prototype date and venue are not real event configuration.
- [ ] E04 Countdown uses the configured date/time/zone instant, not viewer-local midnight; missing/invalid date has a suitable placeholder.

## 12. Approved UI/UX and reusable design

Reuse registered themes/tokens, envelope/letter/previews and shared controls. The referenced separate polish amendment still needs its canonical text; do not invent it.

- [ ] U01 Separate code-based envelope splash uses provisional configurable burgundy/ivory, wax/lace, invitation reveal, approved photography and clear RSVP controls.
- [ ] U02 Upward swipe advances, release holds and downward motion reverses; seal tap offers automatic opening.
- [ ] U03 Completion shows Swipe up to RSVP and requires a fresh gesture/tap, so the completing gesture cannot dismiss it accidentally.
- [ ] U04 Skip, keyboard and reduced-motion behavior work; routine returning wedding-day access is not blocked by repeated animation.
- [ ] U05 Invitation, My Pass and Food & Drinks navigation keeps table and active-order status easy to find.
- [ ] U06 Use approved photography placeholders only; do not regenerate faces or introduce a rotating couple model.
- [ ] U07 Reusable components/tokens carry typography, light/glow, transitions and configurable colours; final polish is Phase 8.
- [ ] U08 Mobile/lightweight guest pages and responsive admin layouts meet keyboard, target, focus, accessibility and reduced-motion checks across themes.
- [ ] U09 Staff controls are large/readable, high contrast and have clear operational empty/error/offline states.

## 13. Mobile data, offline privacy and manual fallback

- [ ] F01 Keep assets/pages lightweight; previously loaded invitation details and entry pass can remain viewable offline with bounded private caches.
- [ ] F02 Sensitive guest/staff data is not broadly cached; connection state and pending/failed submissions are honest.
- [ ] F03 New orders are Received only after server acknowledgement; retries do not duplicate RSVP/orders and reconnect restores live truth.
- [ ] F04 No unsupported offline multi-device seat allocation and no silent replay of stale stock, seat or delivery mutations.
- [ ] F05 Document usher arrival fallback, one designated seating coordinator, waiter assistance and reviewed duplicate/conflict reconciliation after reconnect.

## 14. Retention, history, exports and recovery

- [ ] H01 One-year retention and cloud backups have an explicit starting point; event end remains proposed pending actual agreed policy/configuration.
- [ ] H02 Audit RSVP/extras/check-in corrections/seating/orders/stock/delivery/ID outcomes/staff access/link changes/exports/overrides with actor/action/time and minimal sensitive data.
- [ ] H03 Exports are admin-only and logged; expiry/deletion jobs and backup expiry follow the agreed policy.
- [ ] H04 Incident preservation is authorised, reasoned, scoped and review/release controlled; not indefinite retention of all guest data.
- [ ] H05 Protected backups have a tested restoration procedure and documented external dependencies.

## 15. Integrity, migration and authorisation boundaries

- [ ] D01 Server/database remain authoritative; no browser-local simulation becomes production record storage.
- [ ] D02 Referential integrity, uniqueness, transactions, idempotency, state transitions, scoped permissions and optimistic concurrency are enforced.
- [ ] D03 Preserve applied migration contents/order and real existing guest data; generated append-only integration matches the schema.
- [ ] D04 Test clean and representative populated upgrades, counts/idempotency/RLS and rollback; never delete production data to make migration pass.
- [ ] D05 Realtime or reliable equivalent includes reconnect/reconciliation; hosted migration execution is separately authorised.
- [ ] D06 The destructive legacy bridge stays separately blocked until target review, verified backup, restore rehearsal and execution authorisation.

## 16. Phase ordering and review

- [ ] P01 Deliver Phase 0 checkpoint: exact integration branch/commit, conflict/history decisions, pass/fail/skips/evidence, final-commit CI and remaining environment blockers.
- [ ] P02 Phase 1 is the whole private-link/session/members/RSVP/confirmation/return/edit journey, with synthetic review instructions, stable local URL and screenshots/walkthrough.
- [ ] P03 Continue PM phases 2-9 in the recorded order; include frontend/backend together and notification/audit/permission foundations when earlier journeys need them.
- [ ] P04 Keep independent authorised work moving through external blockers without assuming PM acceptance, production approval or new product decisions.

## 17. Required verification and launch evidence

- [ ] V01 Individual/family/group, mixed attendance/diet, shared-contact non-merging and independent household devices.
- [ ] V02 Repeat/retry/concurrent RSVP and orders, deadlines/time zones, extras before/during event and clean conflict/recovery paths.
- [ ] V03 Partial arrivals, duplicate scans, concurrent seat allocation, oversized households, added tables and capacity changes.
- [ ] V04 Stock races/limits, mixed food/drink preparation, concurrent waiter claims, cancellation boundaries and active-order table changes.
- [ ] V05 Alcohol recipient declaration/check/refusal, persisted notices/provider failures, staff multi-role/revocation and admin two-step controls.
- [ ] V06 Mobile-data interruption, privacy-safe offline views, honest server acknowledgement and reconnect/manual reconciliation.
- [ ] V07 Representative populated migration preservation, backup restoration, retention/hold/export controls and recorded external blockers.
- [ ] V08 Responsive themes, keyboard/reduced motion, actual iOS/Android/WhatsApp/camera behavior, load/concurrency and usher/waiter rehearsal.

## Existing evidence boundary

PR #92 preserves narrow member/upgrade and prior full-gate evidence on its old
base. TICKET-212 preserves local token/service and rollback Postgres evidence;
current develop contains newer staff/ordering/RSVP foundations. Reuse these, but
none substitutes for the integrated commit and whole approved journeys. The
four-worker custom development control failed and is preserved, not called a pass.
Historical skips and non-smoke exclusions must be separated from genuinely
exercised fixture, device, hosted and operational requirements in each checkpoint.
