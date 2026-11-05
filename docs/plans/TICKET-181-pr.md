# TICKET-181: validated theme drafts and atomic activation

Draft planning work for server-side theme persistence. Current runtime resolves
preset IDs only; the intended result supports validated custom drafts and atomic
publication without leaking draft edits to live pages or generated artifacts.

Current changes: implementation plan and handoff only. No feature code, schema,
migration or completed acceptance criteria. Existing dependencies are complete
according to the shared ledger. Base develop c9c9e66010ee773189477139d4f8b0d30cf481e1.

Required evidence: AAL2 denial before I/O, named contrast/font validation failures,
independent drafts, concurrent atomic activation, cache invalidation and selected
variables in initial HTML/artifacts. Unit/database/browser tests, full verification
and applicable UI checks remain outstanding. No production application authorized.

Risks and rollback: preserve preset fallback and current light/dark pairing; never
publish editable draft tokens implicitly. Storage/migration design is still under
review. No deployment or rollback procedure is claimed ready at this stage.
