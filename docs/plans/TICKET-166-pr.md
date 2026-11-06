# TICKET-166: event closure and anonymous memories

Draft implementation for post-event staff/device revocation, closed
ordering and an anonymous CSV/PDF memories pack. Closure must reject premature
requests and unknown venue timezone, require human confirmation, and preserve
admission evidence. This does not authorize production closure or deletion.

Current changes: pure closure eligibility/confirmation guard and allowlisted
aggregate CSV serialization, themed PDF renderer, private download boundary and
aggregate repository. Downloads at `/admin/memories/csv` and `/admin/memories/pdf`
require live AAL2 admin access before querying and use private no-cache attachments.
The repository uses a consistent read-only snapshot of counts and public menu
labels; cancelled station quantities do not count toward menu popularity.
The original22 foundation tests passed; six new PDF tests and the quick lint/type
gate pass. Native PDFKit text/raster inspection passes for the ivory sample;
remaining native visual review is unfinished. Tests cover all four themed A4 PDFs,
privacy projection, invalid counts and long-menu pagination.
Nine download-boundary tests and the quick gate pass. The guarded database aggregate
test is skipped because the isolated database is unavailable; its SQL and actual
route integration remain unverified. The closure transaction and AAL2 Server Action
are implemented with eight passing boundary tests. Closure locks settings, checks
server time and explicit confirmation, clears non-admin PIN material and revokes
devices without deleting admission records. Order submissions hold the matching
share lock and staff submissions recheck expiry after waiting.
The rollback-only database closure rehearsal, existing ordering tests and new
expired-staff-order case are unrun. Live download/closure navigation verification,
actual session and concurrency rehearsal, and full verification remain unfinished.

The protected `/admin/event-closure` page is now linked from the control room. It
offers PDF/CSV downloads and closure with a server-derived cutoff, typed confirmation
and unchecked scanner-evidence acknowledgment. Component tests verify authorization,
navigation and form feedback. Latest quick gate:117 related tests pass, one opt-in
skip, lint/types pass. Browser screenshots, device checks and full UI approval remain
unverified; see `docs/reviews/TICKET-166/ui-review.md`.
Isolated database startup failed; no other stack has been borrowed or stopped.
Use existing06:00 venue-local next-day expiry and current revocation fields where
possible. Base develop c9c9e66010ee773189477139d4f8b0d30cf481e1.

Required evidence: authorization/time gates, atomic/idempotent revocation, staff
session rejection, no contact/dietary identifiers in exports, CSV safety, PDF,
synthetic end-to-end rehearsal and full verification. Applicable UI evidence remains.

Risks: pending offline admissions, concurrent sign-in/orders, accidental early
closure and personal data leaking through export joins. No cleanup/deletion is
included. Rollout/recovery steps will be documented and rehearsed before review.
