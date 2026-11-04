# Ticket

TICKET-032 — Protect admin and staff routes in the request proxy.

# Problem and result

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

# Acceptance evidence

Incomplete. Initial proxy regression: 8 failures / 1 pass. The implemented request
and direct-operation matrix now passes 53 tests. Existing live identity checks are
retained; no new scanner/board/admin mutation feature is claimed.

# Validation and remaining work

Production build, browser matrix, local staff/admin/guest journeys and full verify
are still pending. This PR remains a draft. No acceptance criterion is marked done.

# Risks and rollback

Proxy is only an optimistic filter, never the sole operation authorization. New
privileged actions must invoke live guards themselves. No migrations, new services,
RLS changes or CI modifications. Revert this ticket to roll back the prefilters.

# Screenshots / UI checklist

No visual changes. Existing sign-in layouts and copy are retained; browser checks
will verify that authentication entry points remain usable.
