# Ticket

TICKET-037

# Problem and result

Personal invitations previously hard-coded the couple/date and omitted venue, dress-code and map details. They now render saved event settings in a restrained invitation layout with the approved warm wording and a working reply anchor. Undecided details remain explicitly pending; missing or unsafe map URLs do not produce links.

# Changes

Server-rendered InvitationLetter shared by the personal page and a clearly labelled /dev/invitation/letter preview, linked from /dev. Date-only formatting preserves the wedding day across visitor time zones. Real RSVP saving remains in the existing form. Optional pass content can be reached directly when supplied; signed-pass integration is still TICKET-044.

# Acceptance and evidence

Draft: all criteria remain unchecked pending final review. Four component tests pass after initial missing-module failure. Production build and quick gate pass. Thirteen preview browser cases cover all themes at375/768/1280, axe,44px targets, keyboard anchor focus and long-name overflow. Six existing live RSVP checks pass, including native no-JavaScript POST. Two new isolated database tests verify configured details and long names in server HTML. All12 preview captures inspected: docs/reviews/TICKET-037.

# Remaining checks

Full verification reached459 unit passes and505 browser passes, but failed the route-coverage assertion on both projects. The missing preview route has now been added to the accessibility registry; rerun is pending. Live saved-state visual review, Lighthouse/CLS, final integration/CI and physical-device QA remain. The approved RSVP visual-test update passed12 cases and captured60 live states; manual inspection remains. Three real-invitation Lighthouse runs scored99/100/100 Performance and100 Accessibility; CLS0.008045/0/0, so cold-load stability is not yet approved. Integrating the merged012 font repair and remeasurement remain. Real pass navigation cannot be claimed before044. Physical native-map/WhatsApp checks are unverified.

# Risks and rollout

No schema, dependency, CI or auth changes. Existing token authorization, private response headers and RSVP validation remain. Production timezone remains TBD and RSVP activation stays guarded. Revert this ticket's application changes to restore the previous layout; no database rollback is needed. This draft does not approve guest release.

# Review

Visit /dev, choose Personal invitation layout, and switch among the four themes. For an actual invitation use an authorized test token in the isolated worktree; no personal tokens appear in this PR. See docs/reviews/TICKET-037/README.md for item-by-item results.
