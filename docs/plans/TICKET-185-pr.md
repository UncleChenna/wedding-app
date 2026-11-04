# Ticket

TICKET-185

# Summary

Device-cookie lockout can be reset by replacing the cookie. This draft begins shared
network-based abuse protection for invitation/pass lookups and staff PIN attempts.

# Changes

Adds a keyed network identity helper and its tests. Only explicitly configured Vercel
ingress trusts its platform IP header. IPv6 /64 grouping, mapped IPv4 normalization
and a shared local identity prevent easy identity churn. Adds the implementation plan.

# Acceptance criteria and evidence

All ticket criteria remain incomplete. Atomic storage, expiry, endpoint integration,
retry responses and distributed/shared-household verification remain to be implemented.
No request path currently calls this helper.

# Verification

Identity suite: initially failed for missing implementation; subsequently 12 passed.
Full verification and database tests have not run for this draft.

# Risks and rollout

No rollout yet. Rate budgets require synthetic-traffic review. Migration authorization
will be requested for exact generated paths. Shared NAT may group legitimate users;
limits must accommodate this. This helper does not stop attacks across many networks.

# Screenshots

Not applicable: no UI changes in this draft.

# UI checklist

Not applicable to the current server-only helper. Reassess when responses are integrated.

# Harness changes, if any

None.
