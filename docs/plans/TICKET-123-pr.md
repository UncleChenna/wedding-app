# Ticket

Ticket: TICKET-123

# Summary

Draft: protect unauthenticated order submission with a shared network budget and show an honest retry time without losing the cart or request identity.

# Changes

Planned: extend the existing database limiter with an ordering scope (240 attempts per network per 60 seconds); retain lookup, PIN and lost-link budgets and table-level ordering rules. Derive daily network hashes from the deployment secret so stored identities rotate consistently across instances. Respect Retry-After in the guest flow.

# Acceptance criteria and evidence

Implementation and regression evidence pending. Thirty tables making four attempts each fit within half the proposed ordering budget. The daily identity boundary permits a fresh budget and must be documented alongside existing fixed-window bursts.

# Verification

Pending unit, route, database concurrency, browser, accessibility and full CI verification. No production database changes are authorized by this draft.

# Risks and rollout

Requires a generated additive constraint migration before application rollout. Shared networks share capacity; distributed abuse remains outside scope. Physical phone checks remain release requirements.

# Screenshots

Pending affected guest retry states across themes and required widths.

# UI checklist

Pending implementation and browser evidence; no UI completion claimed.

# Harness changes, if any

None planned.
