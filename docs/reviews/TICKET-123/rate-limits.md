# Ordering protection and rotating network identities

The ordering endpoint now consumes an independent **240 attempts per network per
60 seconds** before reading its body or creating an order. Thirty tables can each
make four attempts (120 requests) with equal headroom remaining. The isolated
database regression proves those 120 requests all pass and only the first 120 of
the next 150 pass, across two connection pools. Existing table cooldown, open-order
and item caps still apply; this does not change their settings or retry replay rules.

Existing policies stay lookup 1,200/60 seconds, PIN 30/600 seconds, and lost-link
10/60 seconds. Raw requests, including malformed orders, consume capacity. Unknown
trusted identity or unavailable storage fails closed with 503; exhausted budgets
return private no-store 429 and Retry-After. Existing Server Actions retain their
form-result protocol and friendly budget message instead of pretending a framework
action transport always exposes a 429 document response.

Network identification keeps the existing ingress trust contract: only Vercel's
configured platform header is trusted on Vercel; other hosts share a local bucket
and ignore spoofed forwarding headers. IPv6 is grouped by /64; mapped IPv4 is
canonicalized. No raw address or credential is stored or logged.

The identity is now HMAC-SHA256 with a daily derived salt, itself HMAC-SHA256 of
the deployment secret and the UTC day number. Both derivations use distinct v2
purpose labels. All instances must share the same secret and synchronized server
clocks. Stored hashes change at UTC midnight, even when the deployment secret is
unchanged. This reduces persistent linkage of database counters; it is not anonymity
against someone who possesses the deployment secret. Administrative key rotation
also resets identities. The rollout changes namespaces once, so existing counters
remain until normal expiry cleanup and do not carry their budget into v2.

Daily rotation deliberately starts a fresh budget at midnight. Together with fixed
windows this permits boundary bursts; a shared-network attacker can consume shared
capacity, and distributed attacks remain outside this control. The five-attempt
device PIN lockout remains independent and is not reset by network hash rotation.

Guests receive a visible wait and retain their choices and request UUID. There is
no automatic retry before Retry-After; once the wait expires, the existing retry
button sends the unchanged request. Explicit edits still create a new logical
order, as before. Invalid/missing retry headers default to 60 seconds; HTTP dates
are supported and defensive waits are bounded to one day (our server emits at
most the configured window).

Migration 0026 only expands the existing scope CHECK constraint and leaves all
rows, RLS and policies intact. Apply it before deploying application code. Reverting
the app is safe with the expanded constraint left in place; do not rewrite applied
migrations or delete existing counters to roll back. Tests ran only on a new owned
native PostgreSQL cluster at the reserved loopback port, starting with zero public
tables. This does not certify Supabase Auth or Realtime behavior.
