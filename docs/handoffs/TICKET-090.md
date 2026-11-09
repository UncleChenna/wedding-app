# TICKET-090 handoff

## 2026-11-09 — implementation in progress

Claimed by divine; isolated branch TICKET-090. Started ahead with explicit authorization and integrated TICKET-089 dc5bd61f into develop base 360914b7. TICKET-089 is now merged and its dependency is resolved.

Implemented authenticated create/edit routes, household/contact/table/roster validation, secure draft creation and untouched-draft deletion. Published invitations use existing revoke/reissue controls. Existing edits lock the invitation and compare a fingerprint covering invitation, members, RSVP and admission counter; stale edits fail closed. Positive RSVP roster corrections update the count without changing the guest's yes/no response or original reply timestamp, preserve remaining members' meals/dietary notes, record the authenticated admin actor, and cannot shrink below admitted people. The history helper remains guest-attributed by default and has a narrow server-only public facade for admin reuse.

Form fingerprints remain tied to the locally edited values across route refreshes. Successful saves replace local member identities with the server's generated IDs. Lifecycle actions invalidate the new editor route.

Evidence so far: 18 unit/action/form tests passed; typecheck passed. Editor invalidation regression failed before the fix. PostgreSQL cases are prepared but not yet run; database slot is reserved for TICKET-092 before this ticket. No database started here. Browser screenshots, axe and real create/edit verification remain pending. Do not mark complete.
