# Ticket

TICKET-032 — Protect admin and staff routes in the request proxy.

# Summary

The proxy previously passed admin requests through and omitted bar routes. This
adds credential prefilters for admin and staff route families while retaining
live authorization at the data/operation boundary. Exact authentication entry
points remain reachable; guest ordering and invitation capabilities stay separate.

# Changes

- Admin proxy checks verified Supabase claims, exact allowlist and AAL2, forwarding
  refreshed cookies. Missing access redirects reads and refuses mutations with 403.
- Staff descendants/API families require a signed, unexpired device-bound session
  for the correct role. All denials are private/no-store and omit technical details.
- Live staff and request-bound admin callback guards deny before touching data.
- Executable request/action actor matrix; expanded production browser coverage.
- Detailed endpoint and bootstrap exceptions in docs/reviews/TICKET-032/access-contract.md.

# Acceptance criteria and evidence

- Admin/staff access: 53 request/direct-operation matrix tests pass, including
  missing/expired/wrong-role credentials, provider failure and callback denial.
- Guest separation: real anonymous ordering passes 6 browser cases; CI invitation
  journey passes both projects. Private admin/staff operations are unavailable to
  guest or anonymous identities. Existing status endpoints disclose no households.
- Production route matrix passes 4 cases; real staff journey passes both projects,
  including gate/kitchen/bar isolation and live credential revocation. Real admin
  MFA passes both projects, including AAL1 restrictions and AAL2 access.
- Current surface inventory and bootstrap exceptions are documented in
  docs/reviews/TICKET-032/access-contract.md. No scanner or station API feature is
  claimed; future operations must use live guards, not merely the proxy.

# Verification

Full local verification passed: 948 unit tests / 74 opt-in skips, 779 browser
checks / 165 opt-in skips (9.4m). All five CI jobs passed at 40bbd79 in run
41752790966, including migrations/seed and the real invitation journey. The final local t:pr gate passed again on 7492aa7: 948 unit passes / 74 skips
and 779 browser passes / 165 skips (8.0m). CLI moved this ticket to in_review.
CI on the final published head remains to confirm; earlier green checks are not
presented as checks for a later SHA.

Initial proxy regressions failed 8/9 before implementation. The first real staff
journey failed while the shared database was unhealthy; after health recovered,
the unchanged mobile/desktop cases passed in 15.1s. Failure and success logs are
retained under artifacts/TICKET-032/. No checks or timeouts were weakened.

Order regression screenshots are directed to this ticket's artifact directory;
no previous ticket's review images were overwritten. Physical-device release QA
remains in the existing release tickets; this change does not certify it.

# Risks and rollout

Proxy is only an optimistic filter, never the sole operation authorization. New
privileged actions must invoke live guards themselves. No migrations, new services,
RLS changes or CI modifications. Revert this ticket to roll back the prefilters.

# Screenshots

No visual changes. Existing sign-in layouts and copy are retained; browser checks
will verify that authentication entry points remain usable.

# UI checklist

N/A for visual changes: no rendered component, styling, typography, theme or copy
was changed. Existing authentication entry screens remain covered by the passing
full browser suite and real staff/admin journeys. Physical release QA is unchanged.

# Harness changes, if any

The ordering browser test accepts an optional ORDER_REVIEW_DIR so integration
runs preserve prior tickets' screenshots. All existing assertions remain intact.
