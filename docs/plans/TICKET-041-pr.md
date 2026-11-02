# Summary

Guests who RSVP yes can add, edit and remove tag-alongs, choose meals and save dietary notes. Attendance counts are derived from the saved list. The server rejects additions beyond the invitation's current limit and checks ownership of every existing guest row.

## Changes

- Add a small client party editor using existing themed controls and the approved tag-along prompt.
- Validate names, meal choices, dietary-note lengths, primary guests and identifiers on the server.
- Lock the invitation and save guest changes and attendance together in a transaction. Preserve contact fields and check published/accepted invitation state again during writes.
- Retain unavailable saved meal choices; only currently available meals can be newly selected. An unpublished menu can follow later.
- Disable the editor without JavaScript and provide a contact fallback; attendance yes/no keeps progressive enhancement.

## Acceptance criteria and evidence

- Limit enforcement:11 pure validation tests plus isolated database rejection and browser-tampered submission.
- Persistence:6 isolated database cases cover add-two/remove-one/reload, names, meals, dietary notes, counts, draft/revoked/declined states and foreign guest identity.
- Browser flow checks every theme at375/768/1280, both reduced-motion modes, axe, target sizes, keyboard focus and overflow.
- Screenshots and per-item UI review: docs/reviews/TICKET-041/REVIEW.md.

## Verification

Full pnpm verify passes:789 unit/database tests,41 skipped;769 browser smoke tests,165 skipped. Skipped checks are not certified. Focused browser flow passes; final no-JavaScript expansion passes (18.4s).

## Remaining release checks

- Signed-pass count refresh passes for both the invitation and original read-only pass; dietary notes remain private.
- Production Lighthouse:98/100/100 performance,100 accessibility each,0 measured CLS each.
- Physical iOS/Android WhatsApp and strict-zero cold-font release gates remain mandatory in TICKET-201.

Preview review retains the existing TICKET-201 device and cold-font release gates. This does not certify production readiness. Final PR gate and CI must pass before human merge.

## Risks and rollout

No migration, schema, RLS, dependency or CI changes. Venue timezone must be configured before editing. TICKET-042 still owns the wedding-day edit lock; TICKET-100 owns the admin change view. Reverting the code leaves existing guest and RSVP data intact.

## Review steps

Use this ticket's isolated synthetic database. Open an invitation, choose Count me in, add two named guests with meals and notes, save, remove one, save and reload. Verify the count is two, then try a tampered over-limit submission. Review all-theme screenshots and the retained release gates before approval.
