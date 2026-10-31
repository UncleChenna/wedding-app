# Ticket

Ticket: TICKET-039

# Summary

Adds a skippable envelope opening to the personal invitation while keeping text and RSVP immediately usable. Draft: production verification and UI review remain in progress.

# Changes

- Small client envelope with token colours, shared monogram and button, 600ms unfold and180ms control feedback.
- Returning-browser flag contains no guest information; reduced motion removes movement.
- Skip/replay retains focus; storage failure never blocks the invitation.
- Preview uses the real invitation's non-streaming rendering approach so ordinary no-JavaScript browsers can read and navigate it.

# Acceptance criteria and evidence

Focused browser tests assert 600ms opacity/transform animations, no reduced-motion animations, first/repeat behavior, keyboard RSVP during opening and skip focus retention. Final production evidence remains outstanding.

# Verification

8 focused unit tests passed.17 browser tests passed on the isolated dev server, including four themes at375/768/1280, axe and ordinary no-JavaScript navigation. Initial failures and their fixes are retained in docs/handoffs/TICKET-039.md. Full verify and Lighthouse are pending.

# Risks and rollout

No migration, dependencies or external services. First visit is per browser, not an identity signal. Clearing browser storage permits replay on next visit; storage-denied guests may see the decoration again. Rollback is a source revert. No guest content or action waits for motion.

# Screenshots

Captured artifacts/TICKET-039/{theme}-{width}.png. Final reviewed production screenshots pending.

# UI checklist

Pending full review. Focused browser checks cover motion, keyboard, contrast via axe, responsive overflow and no-JavaScript. Other checks, physical WhatsApp devices, production performance and CLS remain unverified. No QR or staff output changes.

# Harness changes, if any

None. The handoff records a proposed separate fix for patch/heredoc command inspection.
