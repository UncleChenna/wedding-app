# Dietary information and station projections

TICKET-128 defines the server field contract alongside TICKET-027's proposed ADR 0023.
It does not grant database access or replace live session checks. The authenticated
server chooses the role; never accept a role from a request parameter.

| Data                                      | Admin | Kitchen                    | Gate | Bar         | Anonymous |
| ----------------------------------------- | ----- | -------------------------- | ---- | ----------- | --------- |
| RSVP guest dietary notes                  | Yes   | Only relevant order guests | No   | No          | No        |
| Gate guest name and primary marker        | Yes   | Relevant guests only       | Yes  | No          | No        |
| Deliberately submitted order instructions | Yes   | Own station                | No   | Own station | No        |

The invitation bearer still allows a household to read/edit its own RSVP. That
existing household-authorized route is not an anonymous guest-list endpoint.

## Executable contract

`src/modules/shared/lib/dietary-privacy.ts` uses explicit Zod field allowlists.
`projectGuestForRole` keeps dietary notes only for admin/kitchen; gate gets only
name/primary identity; bar, anonymous and unknown roles get no guest record.
Unknown fields, including nested histories, import records, contacts and generic
notes, are never copied. `gateGuestProjectionSchema` is reused by the actual gate
print projection. Pass readers select only their specific identity/allowance
columns; the gate credential response already rejects unknown nested fields.

`projectOrderInstructionForRole` is a separate projection used by station alert
formatting. Its `note` is deliberately the submitted order instruction
(`orders.notes`, originally validated by `orderSubmissionSchema`). It is not the
guest's private `guests.dietary_notes`. Never populate this field from an RSVP,
RSVP history, CSV import, guest record or generic nested `notes` field.

ORD-3/9 and the existing form label promise operational notes to kitchen or bar
(for example “no ice”). That behavior is preserved. This contract does not guess
medical meaning from text, redact words, or claim that it can prevent someone
voluntarily typing health information into an operational instruction. A separate
private kitchen-only order field would need an explicit UX/data contract change.

## Consumer inventory and required follow-through

- Gate credential endpoint `/api/checkin/revocations`: live gate authorization,
  allowlisted SQL columns and strict nested response schema; private no-store.
- `/p/[pass]`: signature/credential validation precedes its minimal pass reader;
  no contacts, dietary fields or history are selected or rendered.
- Admin printable gate list `/admin/guests/print`: admin authorization, minimal
  server queries, then the gate field projection (export destination is gate).
- Station alerts: actual `createOrder` adapter passes only table, station-filtered
  menu items and the submitted operational note to the station-aware formatter.
  No RSVP/guest lookup occurs in this adapter. Existing queued instructions remain
  operational instructions; there is no destructive outbox rewrite.
- `/bar` and `/kitchen` currently contain sign-in/entry placeholders, not order or
  dietary response endpoints. TICKET-076/077 must use this contract when building
  board queries. Do not claim the future board has been tested today.
- TICKET-033 subscriptions and future TICKET-065 scanner exports must reuse these
  projections or test their own narrower allowlists. Never spread database rows
  into a response, cache, broadcast, log or export. Scope rows by the live role and
  station before projecting; a field projection is not row authorization.
- Admin RSVP/history/CSV exports retain their existing admin-only access. Do not
  reuse those rich records for gate/bar outputs.

TICKET-027 owns RLS/Broadcast policies and direct-key role integration tests.
TICKET-128 remains a draft until that dependency is merged and the combined
contract is checked; unit projection tests alone are not proof of RLS isolation.
