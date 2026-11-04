# Ticket

TICKET-185

# Summary

Device-cookie lockout can be reset by replacing the cookie. This draft begins shared
network-based abuse protection for invitation/pass lookups and staff PIN attempts.

# Changes

Adds a keyed network identity helper and its tests. Only explicitly configured Vercel
ingress trusts its platform IP header. IPv6 /64 grouping, mapped IPv4 normalization
and a shared local identity prevent easy identity churn. Adds an atomic PostgreSQL
counter with database-clock expiry, bounded cleanup and separate scope/network keys.
Generated migration files await exact-path commit authorization and are not yet in
this PR. Adds the implementation plan and migration review.

# Acceptance criteria and evidence

All ticket criteria remain incomplete. Atomic storage and expiry pass isolated tests;
endpoint integration,
retry responses and distributed/shared-household verification remain to be implemented.
No request path currently calls this helper.

# Verification

Identity suite: initially failed for missing implementation; subsequently 12 passed.
Database suite: four cases pass, including 30 concurrent calls through two independent
pools with exactly five allowed. Two earlier runs timed out under Docker resource
pressure; unchanged tests passed after only this worktree's unused services stopped.
Repeat migration preserves counts; all 16 public tables have RLS enabled.
Quick verification passes lint/types/45 related tests (51 opt-in skips).
Full application verification remains pending.

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
