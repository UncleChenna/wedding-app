# TICKET-181: validated theme drafts and atomic activation

Draft planning work for server-side theme persistence. Current runtime resolves
preset IDs only; the intended result supports validated custom drafts and atomic
publication without leaking draft edits to live pages or generated artifacts.

Current changes: internal draft-save service with authorization-before-validation,
canonical theme validation and safe persistence failures; dated plan and handoff.
Seven behavioral tests and lint/types pass. The service has injected boundaries;
internal draft/publication repositories now preserve separate published tokens and
serialize activation. AAL2 admin actions, a single-query published reader and post-commit cache expiry
are now wired. Boundary tests pass (21 related passes/7 opt-in skips plus lint/types);
real database/Auth/browser activation remains unverified. A generated nullable-column migration awaits approval and is
not applied or committed; see docs/reviews/TICKET-181/migration-approval.md.
Quick gate passes lint/types and59 tests, with66 opt-in skips. No database atomicity
or completed acceptance criteria are claimed. Existing dependencies are complete
according to the shared ledger. Base develop c9c9e66010ee773189477139d4f8b0d30cf481e1.

Required evidence: AAL2 denial before I/O, named contrast/font validation failures,
independent drafts, concurrent atomic activation, cache invalidation and selected
variables in initial HTML/artifacts. Unit/database/browser tests, full verification
and applicable UI checks remain outstanding. No production application authorized.

Risks and rollback: preserve preset fallback and current light/dark pairing; never
publish editable draft tokens implicitly. Storage/migration design is still under
review. No deployment or rollback procedure is claimed ready at this stage.
