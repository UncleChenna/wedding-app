# TICKET-090 handoff

## 2026-11-09 — implementation in progress

Claimed by divine; isolated branch TICKET-090. Started ahead with explicit authorization and integrated TICKET-089 dc5bd61f into develop base 360914b7. TICKET-089 is now merged and its dependency is resolved.

Implemented authenticated create/edit routes, household/contact/table/roster validation, secure draft creation and untouched-draft deletion. Published invitations use existing revoke/reissue controls. Existing edits lock the invitation and compare a fingerprint covering invitation, members, RSVP and admission counter; stale edits fail closed. Positive RSVP roster corrections update the count without changing the guest's yes/no response or original reply timestamp, preserve remaining members' meals/dietary notes, record the authenticated admin actor, and cannot shrink below admitted people. The history helper remains guest-attributed by default and has a narrow server-only public facade for admin reuse.

Form fingerprints remain tied to the locally edited values across route refreshes. Successful saves replace local member identities with the server's generated IDs. Lifecycle actions invalidate the new editor route.

Evidence so far: 18 unit/action/form tests passed; typecheck passed. Editor invalidation regression failed before the fix. PostgreSQL cases are prepared but not yet run; database slot is reserved for TICKET-092 before this ticket. No database started here. Browser screenshots, axe and real create/edit verification remain pending. Do not mark complete.

## 2026-11-09 — final local verification

PR: https://github.com/UncleChenna/wedding-app/pull/120. Independent review found successful-action focus and historical check-in preservation edges; both addressed. Browser testing reproduced post-delete404, fixed by redirecting to a guest-list confirmation with deliberate focus. No history deletion or guard weakening.

19 focused unit tests, six rollback-only PostgreSQL cases, production build, quick gate (lint/types/12 related tests) and two real authenticated browser journeys pass. Final browser14.2s;16 axe scans across four themes and both form states report no violations. Screenshot folder docs/reviews/TICKET-090/screenshots. Full evidence and limitations: docs/plans/TICKET-090-pr.md.

Database slot released: wedding-30686dddb521 stopped backup:true, exit0, /tmp/TICKET-090-stop.log. No further DB needed unless integration changes behavior. Next: commit/push final evidence, integrate freshly fetched develop, run quick validation, ready PR through CLI, obtain final independent source review and full green CI. Do not mark done before merge.

Verified lessons: scope status locators to the intended confirmation because global/lifecycle live regions coexist; use visible role locators because Next retains hidden previous routes. Avoid rendering a deleted editor after revalidation: redirect to a surviving authenticated destination.
