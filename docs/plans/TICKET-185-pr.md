# Ticket

TICKET-185 — Protect invitation and PIN endpoints before invitations launch.

# Summary

Replacing a device cookie could reset PIN protection. Shared database-backed request
budgets now protect invitation/pass reads, RSVP actions and staff PIN attempts across
instances, before sensitive work occurs.

# Changes

- Atomic PostgreSQL counters with database-clock expiry, bounded cleanup and RLS.
- HMAC network identities; trusted Vercel ingress only, normalized IPv4/IPv6 and
  a shared local bucket that ignores spoofed headers and client cookies.
- Private 429/503 responses, Retry-After and generic action feedback. Native HTML
  retry pages preserve status codes and support keyboard/no-JavaScript retry.
- Metric-matched font fallbacks and reserved space keep retry-page CLS at zero.
- Generated additive migration 0012, explicitly authorized for commit by the owner.

# Acceptance criteria and evidence

All three ticket criteria are checked. Two independent database pools admit exactly
five of 30 simultaneous attempts against a budget of five. Expiry, scope separation,
RLS and 1,050 requests from 350 synthetic households pass. HTTP/browser tests cover
private routes, forged headers, cookie resets, PIN lockout, keyboard retry and themes.
Owner approved lookup 1,200 requests/60 seconds and PIN 30 requests/600 seconds per
network, retaining the existing five-failed-attempt device lockout.

# Verification

Integration base: develop `696baef1894bc639018bad7eff129506a6e32544`, including
merged TICKET-032. Both authorization and guest budgets are retained. Nineteen
proxy tests cover their interaction.

Final integrated `pnpm t:pr TICKET-185` passed on `4f817c0`: formatting, lint,
types, 985 unit tests, production build and 779 browser checks (9.6m). The 88 unit
and 165 browser skips are not certified coverage. Log:
`artifacts/TICKET-185/recovered-pr-gate.log`.

All five explicit limiter database cases also passed unchanged after the isolated
stack recovered. The exact previously failing private-route browser case passed
unchanged in 888ms before the full run. Earlier timeouts and their environment
observations remain preserved in the handoff and artifacts; no assertions or
timeouts were relaxed. Prior repeat migration preserved counts and all 16 public
tables retained RLS. No schema or application code changed during recovery.

# Risks and rollout

Apply the additive migration before deploying consuming code. Commit/local testing
approval does not authorize production application. Application rollback may leave
the additive table intact; do not drop data. Shared networks can exhaust their
budget; fixed windows permit boundary bursts and do not stop distributed attacks.
Non-Vercel production requires a reviewed ingress identity contract. Deployments
must share the existing signing secret; no raw IPs, PINs or invitation tokens are logged.

# Screenshots

24 guest/PIN screenshots across four themes and 375/768/1280 are in
`docs/reviews/TICKET-185/screenshots/`; all inspected, with 12 guest captures refreshed
after the font fix. Axe, overflow, keyboard and tap-target checks pass.

# UI checklist

Owner approved native HTML/existing local fonts to preserve 429/503 status, with
physical-phone checks retained as release requirements in TICKET-201. No device
pass is claimed. Six delayed-font variants measure CLS 0. Three Lighthouse 12.6.1
mobile runs score Performance 100/100/100 and Accessibility 100/100/100, CLS 0.
Lighthouse's explicit error-page option preserves real 429/no-store responses;
its expected status warnings remain in `docs/reviews/TICKET-185/performance.json`.
Safe default light/dark themes are used during outages without database theme reads.

# Harness changes, if any

None. The requested approval-workflow simplification is isolated in TICKET-215 / PR #97.
