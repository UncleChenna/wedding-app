# Ticket

[TICKET-035](../blob/TICKET-035/tickets/TICKET-035-choose-the-invitation-voice-and-approve-guest-fa.md) — Choose the invitation voice and approve guest-facing copy.

# Summary

The invitation voice was undecided, blocking downstream message and RSVP work. Warm is now the recorded choice, with the existing PRD wording available from one typed copy catalogue.

# Changes

- Record the couple’s 2026-10-26 Warm choice in the PRD, keeping existing wording unchanged.
- Export `invitationVoice`, `invitationMessages`, `InvitationVoice` and `invitationSiteCopy` from the invitation copy module. Retain Playful/Formal WhatsApp alternatives for the settings-driven renderer.
- Reference those exports from TICKET-052 and document handoff/evidence.

# Acceptance criteria and evidence

- PRD records Warm and confirms no wording edits.
- All 20 exported strings match whitespace-normalized PRD text exactly; default voice is Warm. TICKET-052 explicitly references the shared module.

# Verification

`pnpm verify:quick` and `pnpm verify` passed: format, lint, types, 251 unit tests, production build, 155 browser tests; 17 existing conditional skips. Executed the copy module and compared all exported strings against the PRD. No implementation-mirroring constant tests added.

# Risks and rollout

No migrations, credentials or message delivery. Placeholder substitution/settings integration remains TICKET-052; final pre-send proofreading remains TICKET-158. Production screens will consume the catalogue in their feature tickets. Existing preview strings and visible pages are unchanged. Revert this commit to undo the catalogue and decision record.

# Screenshots and UI checklist

Not applicable: copy constants and documentation only, with no rendered UI or routes changed. Full verification passed; no new physical-device or WhatsApp testing is claimed.

# Harness changes

None. The managed checkout’s optional database startup was cancelled because this ticket requires no database. Local database readiness is not claimed.
