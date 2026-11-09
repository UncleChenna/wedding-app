# Ticket

TICKET-091 — Import guests from CSV with a validation preview.

# Summary

Draft upload-and-confirm UI for TICKET-182's transactional guest importer. The
component lets an admin choose a CSV, review errors or grouped invitations, then
explicitly confirm the import. Backend integration and the production route remain
pending while PR #124 completes verification.

# Changes

- Added an upload/preview/confirm component with injected actions and a display-only
  view model. Parsing and database writes remain owned by TICKET-182.
- Files are bounded to 256 KB and decoded as strict UTF-8. Selecting another file
  immediately invalidates approval; delayed results for the old file are ignored.
- Confirmation sends only the approved preview ID and digest. Stale/expired
  approvals require another preview; replay reports no duplicate invitations.
- Expiry cannot override an in-flight commit's authoritative success. Errors and
  completion results receive keyboard focus. Controls use the admin 18px rule.
- Prepared an opt-in authenticated browser harness for malformed/corrected files,
  300-row imports, replay protection and preservation of existing RSVP data.

# Acceptance criteria and evidence

Not complete: the real backend adapter, private route, 300-row browser/database
flow and visual evidence still need integration and verification after TICKET-182
merges. No production import functionality is claimed by this draft.

# Verification

Eleven focused tests pass: nine component flows plus UTF-8/BOM decoding and
malformed-byte rejection. Initial missing-module and expiry-during-commit failures
were reproduced before fixes. Quick lint, types and related tests pass. The
prepared browser harness is typechecked but has not run.

# Risks and rollout

Draft only; cannot finish until TICKET-182 is merged and actual database/browser
tests pass. No production data or schema operations are proposed by this ticket.
Raw CSV stays out of URLs, logs and persistent browser storage. TICKET-182 documents
the server-side preview and receipt retention policy.

# Screenshots

Pending the connected page and all-theme browser verification.

# UI checklist

Pending browser evidence for the admin scope, including 18px controls, 44px targets,
keyboard/focus, layout stability and all-theme accessibility. Unit tests are not
presented as proof of browser or physical-device behavior.

# Harness changes

None. The browser harness is opt-in until the implementation is connected.
