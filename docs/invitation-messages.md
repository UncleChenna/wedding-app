# Invitation message templates

TICKET-052 fills the approved PRD copy in `src/modules/invitations/lib/copy.ts`. It does not send messages, mark invitations sent or change the selected wording. Warm is the database and draft-settings default. Playful/Formal are selectable for the WhatsApp invitation; email and reminders retain their single approved PRD versions.

## APIs

`renderInvitationMessages(recipient, settings)` is pure. Supply `{ guestName, link }` and settings containing `coupleNames` and `invitationVoice`. It returns `{ ok: true, messages }` or an expected validation error. Messages contain `whatsapp`, `email.subject`, `email.body`, `rsvp` and `dayBefore` strings. Each body already includes the personal link. Consumers should not append it again.

`getInvitationMessages(recipient, database?)` is server-only and reads current event settings for each render. The caller must first authorize the invitation and obtain the recipient and link from trusted application data. It never fetches guest data from a guessed token, exposes a public action or performs delivery.

`saveInvitationVoice(value, database?)` in shared server settings validates and persists one of warm/playful/formal while preserving every other settings field. This internal helper is intended for the authorized TICKET-101 admin settings boundary; it performs no authorization itself and must not be exposed directly as an unprotected action. There is no new settings UI in this backend ticket.

## Validation and transport

Names are trimmed, nonblank, at most200 characters and contain no line breaks or literal braces. Links must be absolute HTTP(S), at most2048 characters, without credentials, line breaks or literal braces. Unsupported voices and unresolved placeholders return an expected generic error without echoing private input. Replacement is single-pass and callback-based: dollar signs and replacement-looking strings remain literal values.

Outputs are plain text. Render through React text nodes or encode once for the selected transport; do not interpret them as HTML. A message renderer does not confer permission to send an invitation or reveal its link. Final human proofreading remains TICKET-158.

## Migration and rollback

Generated migration0005 adds `event_settings.invitation_voice` with Warm default and a database constraint matching the approved choices. Existing rows receive Warm, preserving their other fields. Deploy the migration before application code that selects this column. Application rollback can leave the additive column in place; do not manually edit or delete an applied migration. No RLS policy or account changes.

Verification is recorded in the TICKET-052 handoff. All database exercises use the managed isolated stack and synthetic fixtures; no production database is migrated here.
