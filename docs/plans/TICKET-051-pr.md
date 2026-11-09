# Ticket

Ticket: TICKET-051

# Summary

Sharing currently leaves the guest list's sent timestamp unchanged. This draft records sharing attempts, publishes a draft on its first attempt, preserves RSVP responses and first-send time on repeats, and offers a bounded Undo without claiming delivery or recalling messages.

# Changes

- Private RLS-enabled share-event schema records channel, verified actor, invitation version, previous state and Undo time; no bearer link, contact or message content is stored.
- Authenticated server actions serialize changes on the invitation row, validate client input, deduplicate request IDs and invalidate both admin lists.
- Undo is limited to the same actor's latest event within ten minutes, cannot reverse later revocation/reissue, and preserves a subsequent RSVP.
- WhatsApp/email intents, successful clipboard copying and resolved native sharing record attempts. Native cancellation records nothing. Real admin callers supply tracking identity; preview sharing stays inert.
- Draft invitations can now be shared from the authenticated admin pages. Guest-list filtering remains separate from RSVP status.

# Acceptance criteria and evidence

- First/repeat sharing and RSVP preservation: seven pure policy tests pass. Persisted verification remains outstanding.
- Sent filters: integrated prerequisite TICKET-089 at 60cb0985; its own browser evidence is still in progress. This PR stays draft until that prerequisite merges.
- Native cancellation, successful copy/native sharing, external intent channels, recording failure and Undo feedback: six component tests pass.
- Generated migration, isolated database tests, authenticated browser journey and UI evidence remain incomplete. No acceptance checkbox is marked complete from mocked evidence alone.

# Verification

- Initial policy test failed on the missing implementation; all seven now pass.
- Focused policy/action/UI/helper suite: 16 passed before three additional UI cases; latest component suite six passed.
- Service input validation test passes. Action tests verify authorization and both revalidation paths.
- Quick gate passed lint, types and 76 related tests, with 87 opt-in tests skipped before the last three UI cases were added. A previous run failed because the service eagerly imported environment-dependent DB configuration; typed injection corrected it.
- Three opt-in persisted tests are written but not run. No database started during another ticket's reserved slot.
- `db:generate` refused the pre-bootstrap managed database target. No migration generated or applied yet; complete managed bootstrap in the allocated DB slot, generate, migrate twice, check counts and RLS.

# Risks and rollout

Do not deploy this draft: the schema migration and database/browser verification are outstanding. External app opening and copying are attempts, never proof of delivery. Undo changes bookkeeping only. Integrate fresh develop before migration generation to avoid migration numbering collisions. Preserve all existing release-device gates.

This ticket's managed start used the locally configured coordination owner `unclechenna` and agent `codex` on an unclaimed ticket. The same actual agent continues the claim under explicit coordination; no collaborator's claim was changed.

# Screenshots and UI checklist

Not yet captured. Required admin evidence is a 375px screenshot, keyboard/Undo/refresh checks and axe/contrast in each theme. Source uses existing Button, Sheet, Input and theme tokens; browser accessibility, overflow and focus remain unverified. Guest QR/photography and animation are unchanged. Physical device checks remain unverified rather than passed.
