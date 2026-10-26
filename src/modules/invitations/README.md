# invitations

Personal invitation links (`invitations.code`), RSVP (`rsvps`), household guests and tag-alongs (`guests`), and each guest's gate QR token (`guests.qr_token`). Routes: `src/app/(guest)/invite`.

## Implemented previews

`/dev/invitation` displays the invitation layout. `/dev/rsvp` provides attendance, a sample primary guest, up to two named companions, sample meals, a review step and both confirmation outcomes. Back navigation and theme switching preserve the draft; reload/reset discards it. No server action, browser storage, database or guest messaging is used.

`lib/rsvp-preview.ts` validates sample rules only. Production integration must obtain invitation identity, companion allowance and meal availability from trusted server data and validate again on the server; never trust this preview state as a saved RSVP. Real confirmation, edit locks and QR issuance remain in their production tickets. Performance and actual-device release checks are tracked separately in TICKET-201 under the user-approved preview exception.
