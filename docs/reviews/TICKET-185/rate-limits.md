# Proposed launch request budgets

These defaults await the ticket's human review; they are not yet approved launch policy.

| Scope  | Budget per network | Window      | Coverage                                                                             |
| ------ | ------------------ | ----------- | ------------------------------------------------------------------------------------ |
| Lookup | 1,200 requests     | 60 seconds  | Invitation and signed-pass GET/HEAD, PDF/image/offline downloads, RSVP/party actions |
| PIN    | 30 requests        | 600 seconds | Staff sign-in actions, including malformed submissions                               |

The existing five-failed-attempt device lockout remains in addition to the network
budget. Six operators on one Wi-Fi network can each make five attempts within the
network budget. Successful sign-ins also consume it; clearing cookies cannot reset it.

## Evidence

Five real PostgreSQL tests passed in 1.89 seconds on the isolated ticket database.
Two independent pools made 30 simultaneous requests against a budget of five:
exactly five passed. Another case made 1,050 requests for 350 synthetic households
sharing a network (three requests each); all passed within the 1,200 request window.
Expiry, scope/network isolation and RLS checks also passed. This is counter-level
traffic evidence. The subsequent real HTTP/browser suite passes six cases, with
two duplicate matrix skips: private-route 429/no-store responses despite forged
headers/cookies, PIN cookie-reset resistance, native keyboard retry, all-theme
accessibility and cold-font layout stability. See [UI review](ui-review.md).
These results do not imply approval of the proposed launch budgets.

## Identity and trust

On Vercel, the runtime environment flag selects its platform-provided
`x-vercel-forwarded-for` header. No request header can select the trust mode.
Malformed values, missing identity or an absent hashing secret fail closed.
IPv4 uses an address; IPv6 uses /64 to group privacy addresses. Mapped IPv4 is
normalized. HMAC uses the existing server-only `STAFF_SESSION_SECRET`, with explicit
`rate-limit:v1:` purpose separation. Every instance must share that deployment secret.
Rotation starts a fresh identity namespace; it is an administrative operation.

Outside Vercel, all requests share one fixed bucket and forwarded headers are ignored.
This supports isolated local runs without trusting spoofed headers. Self-hosted
production needs a separately reviewed ingress contract before network-specific
budgets can be enabled. No raw IP, PIN, token or database exception is logged.

## Responses and limits

Denied reads return private no-store 429 responses with Retry-After and generic
retry wording. Identity/store failures return generic no-store 503 responses.
Actions return the same retry guidance through their existing form status area.
GET/HEAD are counted once in Proxy; POST actions count themselves so invocation
from a different page cannot bypass the check. Public metadata uses no guest lookup.

Fixed windows allow a burst near each window boundary. Network limits cannot prevent
a distributed attack from many networks. A malicious user sharing a network can
consume its budget; generous lookup capacity reduces accidental household collisions
but cannot remove that denial-of-service tradeoff. Expired counters are logically
inactive immediately and removed in bounded batches as requests arrive; no external
scheduled service is required. Existing private offline passes remain readable offline.
