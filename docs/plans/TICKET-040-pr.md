# Ticket

Ticket: TICKET-040 — Build the RSVP form for attending yes or no.

# Summary

Draft: personal invitations gain persisted yes/no replies with the approved warm confirmation. The form supports native submission without JavaScript. Final browser cleanup and UI release checks remain incomplete.

# Changes

- Validate the invitation capability and attendance choice with Zod.
- Lock/recheck published invitations in a database transaction, upsert one RSVP, and update status atomically.
- Reuse existing buttons and theme tokens; display saved confirmation on reload.
- Keep replies closed while venue timezone is TBD; isolated tests use a labelled fixture timezone.
- Render this private route without a JavaScript-dependent streaming placeholder.
- Send only the site origin in referrers, never the invitation path/token; keep Next.js action origin checks.
- Let POST reach its own authorization check instead of rewriting away the Server Action module.

# Acceptance criteria and evidence

Five real database tests passed. Six mobile/desktop browser tests passed for JS/no-JS submission, persisted yes/no state, tampering and revocation before the final Proxy cleanup. Final visible rejection assertion and all-theme review are pending; criteria remain unticked.

# Verification

Initial failing service tests established the missing implementation; 18 related tests subsequently passed. Strict types and production build passed before the latest Proxy change. Full final verify, responsive screenshots, axe/keyboard, CLS and Lighthouse remain pending.

The latest rebuild is blocked by a Turbopack local-port panic reproduced after a sandboxed build. Exact-path cache-clear approval is pending. Previous macOS sleep interruptions also stretched tests; these were not counted as passes. No test, hook or CSRF check was bypassed.

# Risks and rollout

Not ready to merge. Venue timezone remains TBD, so live replies stay closed. No migrations, RLS or dependencies changed. Tag-alongs, edit lock and change history remain linked follow-up tickets041/042; this is not launch-ready RSVP.

Blocking personal HTML changes first-response timing; performance needs measurement. The browser test verifies token-free referrers on both native/hydrated POSTs. Reverting this code removes RSVP functionality but does not delete saved replies.

# Screenshots

Pending; no visual approval claimed.

# UI checklist

Not yet complete. Responsive/all-theme captures, native device QA and guest performance remain unverified.

# Harness changes, if any

No hook or policy changes. Local tests use explicit opt-in and verify isolated database identity. See docs/handoffs/TICKET-040.md and ADR0019 for failures, fixes and exact next commands.
