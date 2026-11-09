# Ticket

Ticket: TICKET-123

# Summary

Order submissions now have a shared network budget before body parsing or database writes. Guests who reach the limit see a timed retry message, keep their cart and request identity, and cannot retry before the server’s wait expires. Stored network hashes rotate daily without storing raw addresses.

# Changes

- Separate ordering budget: 240 attempts per network per 60 seconds, with capacity for 30 tables making four attempts each plus equal headroom. Existing lookup 1,200/60s, PIN 30/600s and lost-link 10/60s policies remain unchanged.
- Daily server-owned HMAC salt derivation, keeping trusted-platform ingress selection, IPv6 /64 grouping and cookie/header spoof resistance.
- HTTP 429 with Retry-After/private no-store; identity/database failure remains fail-closed 503. Existing table cooldown, open-order/item caps and atomic idempotency remain intact.
- Client distinguishes rate limits from connectivity failure. No automatic early retry; the unchanged cart and UUID are reused after the wait. Invalid headers use a safe default and HTTP dates are supported.
- Generated migration 0026 expands only the request-budget scope constraint. Existing rows, RLS and policies are retained.
- CI adds atomic budget tests and mobile/desktop network-limit recovery to the existing disposable PostgreSQL guest journey job. All scanner, migration and other verification steps remain present.

# Acceptance criteria and evidence

- Limit responses: focused route tests prove 429/503 before body parsing/create and friendly no-store responses. Real browser checks prove ordering 429, invitation lookup limits despite spoofed headers, and PIN limits despite cookie removal. Existing Server Actions retain their typed form-result protocol; their HTTP action transport is not falsely described as a 429 page response.
- Rotating hashed identities: regression first failed against the static digest, then passed with within-day stability, midnight rotation and 64-hex storage. Existing IPv4/IPv6 normalization and spoof-resistance tests pass.
- Shared-network capacity: actual PostgreSQL tests allow 120 concurrent attempts, then exactly 120 of another 150, preserving the 240 cap across two pools and independent lost-link scope.

# Verification

- Initial regression proof: 3 failures (missing rotation, ordering policy and friendly Retry-After outcome); all passed after implementation.
- Initial focused unit suite: 50 passed. Follow-up focused route, client, cross-endpoint and real order database suite: 52 passed.
- Atomic budget database suite: 6 passed, including shared-network concurrency. Generated migration applied twice; row/migration counts identical, all 24 public tables retain RLS.
- Production build passed. Final local browser suite: 8 passed in 45.6s, proving real 429/cart preservation, unchanged retry body, three lost responses creating exactly one order, lookup spoof resistance and PIN cookie-reset resistance.
- 24 screenshot/axe combinations: both browser projects × four themes × 375/768/1280. Independent reviewer inspected all 24 limited-state captures and found no clipping, overlap or material issue. Source/CI review also found no material issue.
- Initial quick gate: lint/types passed; 154 tests passed, 133 conditional skips. Combined-base quick lint/types passed. Final full unit suite passes with per-file coverage requirements unchanged (98.27% lines, 98.46% branches). Exact-head hosted CI remains pending; no full CI pass claimed yet.
- CI run42709444892 exposed missing documentation for the new test flags and a fixture ordering conflict: ordering retains a closed settings row, while the existing offline scanner fixture inserts its own singleton. Both flags are now documented; ordering checks follow the original scanner sequence. The focused CI-parity regression passes2/2 and the full unit suite was rerun successfully. No test or timeout was weakened.
- Local production/browser measurements preceded the scanner-only base integration; hosted CI verifies the combined source and new explicit reduced-motion/44px assertions.
- Integrated develop 143b4d637b8bfc4597f8f990a5085f2722454967. The additive CI conflict was resolved by preserving both scanner and ordering steps.

# Risks and rollout

See [budget and privacy decisions](../reviews/TICKET-123/rate-limits.md). Migration must precede application deployment. The expanded constraint can remain when rolling back app code; never rewrite applied migrations. Daily rotation and fixed windows permit boundary bursts; one hostile guest can consume shared Wi-Fi capacity. Distributed attacks and self-hosted ingress contracts remain outside scope.

Only a fresh owned PostgreSQL16 cluster on the managed loopback port was used; it began with zero public tables. It is now stopped with its data directory retained. No production database, collaborator database, Supabase Auth or Realtime behavior was altered or certified.

Mobile Lighthouse on the real selected-table page: performance **86/88/89**, accessibility **100/100/100**, CLS **0/0/0**. The 95 performance target is not met. Physical WhatsApp iOS/Android checks remain unverified. Both remain mandatory release requirements under TICKET-201, not claims of completion or weakened targets.

# Screenshots

[Mobile captures](../reviews/TICKET-123/mobile/) · [Desktop captures](../reviews/TICKET-123/desktop/) · [Lighthouse reports](../reviews/TICKET-123/lighthouse/).

Replay tests initially regenerated older TICKET-074 captures. Those originals were restored in a corrective commit before pushing; new replay output is retained only in ignored TICKET-123 artifacts. The final PR diff does not change TICKET-074 evidence.

# UI checklist

- PASS: required-width/all-theme captures, axe contrast/accessibility, token reuse, readable wrapping and restrained existing layout; independent visual review clean.
- PASS: keyboard retry submits the same request and successful confirmation receives focus. Waiting retains choices and disables early retry.
- PASS: no new animation, image, font or shared component; existing ActionBar/Button retained. Three production Lighthouse runs report zero CLS.
- Pending hosted rerun: explicit reduced-motion and 44px primary-target assertions added to the network-limit regression after the local matrix.
- NOT VERIFIED: physical phones/WhatsApp; retained release requirement TICKET-201.
- FAIL release target: mobile performance below 95 as measured above; retained TICKET-201 requirement.
- N/A: no QR, Open Graph or staff feedback output changed.
- Pending: final exact-head full CI verification.

# Harness changes, if any

No hooks or validators changed. CI runs two additional scoped checks using its existing database and browser installation, with unchanged timeouts and prior checks.
