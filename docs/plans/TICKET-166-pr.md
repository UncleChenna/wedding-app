# TICKET-166: event closure and anonymous memories

Draft implementation planning for post-event staff/device revocation, closed
ordering and an anonymous CSV/PDF memories pack. Closure must reject premature
requests and unknown venue timezone, require human confirmation, and preserve
admission evidence. This does not authorize production closure or deletion.

Current changes: pure closure eligibility/confirmation guard and allowlisted
aggregate CSV serialization and an internal themed PDF renderer, plan and handoff.
The original22 foundation tests passed; six new PDF tests and the quick lint/type
gate pass. Native PDFKit text/raster inspection passes for the ivory sample;
remaining native visual review is unfinished. Tests cover all four themed A4 PDFs,
privacy projection, invalid counts and long-menu pagination.
Transactional revocation, admin action, aggregate queries, download wiring and end-to-end
rehearsal remain unfinished. Isolated database startup failed; diagnosis ongoing.
Use existing06:00 venue-local next-day expiry and current revocation fields where
possible. Base develop c9c9e66010ee773189477139d4f8b0d30cf481e1.

Required evidence: authorization/time gates, atomic/idempotent revocation, staff
session rejection, no contact/dietary identifiers in exports, CSV safety, PDF,
synthetic end-to-end rehearsal and full verification. Applicable UI evidence remains.

Risks: pending offline admissions, concurrent sign-in/orders, accidental early
closure and personal data leaking through export joins. No cleanup/deletion is
included. Rollout/recovery steps will be documented and rehearsed before review.
