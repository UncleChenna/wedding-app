# Ticket

TICKET-044 — Show the guest's QR pass after they RSVP yes.

# Summary

Draft implementation checkpoint. Accepted RSVP guests still lack a signed pass inside their invitation. This branch starts the server issuance service; it is not yet wired to a page.

# Changes

Recheck current invitation status, attendance and seats before issuing through the existing signer. Reject malformed identities and ineligible records, handle missing keys safely, sign the current token version and return a read-only pass URL plus display data. The internal service requires a caller-authorized identity; it is not exposed as a public action.

# Acceptance criteria and evidence

All product acceptance criteria remain incomplete. Still required: authorized invitation lookup and route wiring, real QR display and SVG decode/contrast evidence, first/return visit behavior, reduced motion, UI matrix and device scanning.

# Verification

Missing-module test failed before implementation.34 focused tests pass across issuance, resolver and signing-boundary suites. verify:quick passes lint, types and related tests. Full verification has not run for this checkpoint.

# Risks and rollout

Do not expose the identity-based service without invitation credential authorization. No migration, RLS or dependency changes. No deployed behavior changes yet; revert the ticket to roll back. Physical scanning and WhatsApp checks remain unverified. TICKET-209 overlaps the eventual invitation integration and remains unmerged.

# Screenshots

Not applicable to this server-only checkpoint; required before the eventual UI is reviewed.

# UI checklist

Not yet verified. No UI implementation is included in this checkpoint. All final all-theme, accessibility, motion, performance and physical-device requirements remain open.

# Harness changes, if any

None. The handoff records an observed shell-guard quoted-data parsing issue for a future focused fix.
