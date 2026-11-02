# Ticket

TICKET-044 — Show the guest's QR pass after they RSVP yes.

# Summary

Accepted guests now see their signed QR pass inside the personal invitation and can reopen it without envelope animation. Reply changes immediately add or remove the pass. Preview delivery under the approved device-QA exception; physical release checks remain open.

# Changes

- Resolve the private invitation credential to an eligible identity and version snapshot; recheck current RSVP/seats and reject concurrent rotation before signing.
- Render a themed server SVG with approved Warm copy, guest name, party size, table and read-only pass link. Never encode the editing credential or personal details in the signed payload.
- Preserve RSVP editing, pass anchor and reduced-motion return behavior. Missing signing keys show a safe message.
- Refresh the authorized page after successful yes/no submissions.
- Add real SVG decode/contrast tests and isolated browser review with ephemeral keys and cleaned synthetic fixtures.

# Acceptance criteria and evidence

Functional requirements are covered by unit and live browser tests: signed URL decode, quiet zone/contrast, accepted-only display, first/return visits and every theme. All24 screenshots inspected; keyboard/long-name tests pass. Lighthouse Performance99/100/100, Accessibility100 and CLS0 in all three runs. Physical device/scanning checks remain unverified and explicitly block release through TICKET-201.

# Verification

Full pnpm verify passes:656 unit tests and697 browser smoke tests;27 unit and147 browser skips are not certified. Additional isolated live suite:4 pass, covering the signed pass/theme/width/motion matrix, no-JavaScript RSVP, tampering and revocation. Missing-key mode passes4 tests (the separately passed signed-key scenario is skipped in that mode). The rendered SVG unit test decodes a realistic long signed URL in all four theme colours. Earlier failing tests and results are recorded in the handoff/review.

# Risks and rollout

Requires deployment signing keys already defined by TICKET-056; none are added by this PR. No dependency, migration or RLS changes. Private page reads remain request-time. Do not expose the internal identity service as an unauthenticated action. TICKET-209 overlaps invitation composition and remains unmerged; integrate sequentially. Revert this ticket to roll back; no data conversion.

# Screenshots

24 synthetic captures in docs/reviews/TICKET-044/: pass section/full invitation ×four themes ×375/768/1280. All12 pass sections inspected; all full-page screenshots and long-page slices also inspected.

# UI checklist

See docs/reviews/TICKET-044/REVIEW.md for every item. Accessibility matrix, contrast, copy, responsiveness and reduced-motion journey pass. Measured performance/CLS and keyboard checks pass as detailed above. Physical iOS/Android WhatsApp/scanning remains unverified; this is preview approval only.

# Harness changes, if any

No shared harness changes. A ticket-specific review script uses ephemeral in-memory signing keys and isolated synthetic data.
