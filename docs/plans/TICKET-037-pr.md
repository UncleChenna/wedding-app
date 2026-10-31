# Ticket

TICKET-037

# Problem and result

Personal invitations previously hard-coded the couple/date and omitted venue, dress-code and map details. They now render saved event settings in a restrained invitation layout with the approved warm wording and a working reply anchor. Undecided details remain explicitly pending; missing or unsafe map URLs do not produce links.

# Changes

Server-rendered InvitationLetter shared by the personal page and a clearly labelled /dev/invitation/letter preview, linked from /dev. Date-only formatting preserves the wedding day across visitor time zones. Real RSVP saving remains in the existing form. Optional pass content can be reached directly when supplied; signed-pass integration is still TICKET-044.

# Acceptance and evidence

Owner approved keeping the conditional pass slot/anchor in TICKET-037 and moving actual returning-guest signed-pass integration into TICKET-044. Both ticket definitions record the decision; no functionality is dropped or falsely marked delivered.

Four component tests and quick verification pass. The final targeted browser run passed25 cases:13 preview checks and12 real saved-RSVP visual cases. All12 preview screenshots and60 live screenshots have been refreshed and inspected across four themes and375/768/1280 widths. Earlier tests also proved native no-JavaScript RSVP persistence, token denial and configured event details with80-character guest/couple names.

Merged develop base5bd56a82d37942a1a046fc1b1c93c22f2a6829bc, including the owner-authorized unchanged migration files. Explicit headline sentence lines and letter-aligned body copy eliminated measured cold-load shift in the real test invitation: CLS0/0/0. Accessibility scored100 in all three final Lighthouse runs. Performance90/95/98 does not yet consistently meet the95 threshold; all results are retained.

# Remaining checks

Draft remains incomplete: investigate performance variability, record the currently running full verification result, retain physical WhatsApp/iOS/Android/native-map QA as unverified. TICKET-201 remains the device release gate. The previously failing accessibility route registration has been corrected; no assertion was removed. All16 intermediate-width checks at410/640/900/1024 passed. Signed passes remain mandatory in TICKET-044.

Screenshots and detailed checklist: [review evidence](../reviews/TICKET-037/README.md). Production venue/time/timezone/dress code remain TBD; no sample details are presented as actual arrangements.

# Risks and rollout

No schema, dependency, CI or auth changes. Existing token authorization, private response headers and RSVP validation remain. Production timezone remains TBD and RSVP activation stays guarded. Revert this ticket's application changes to restore the previous layout; no database rollback is needed. This draft does not approve guest release.

# Review

Visit /dev, choose Personal invitation layout, and switch among the four themes. For an actual invitation use an authorized test token in the isolated worktree; no personal tokens appear in this PR. See docs/reviews/TICKET-037/README.md for item-by-item results.
