# TICKET-081: reduce cold order-page traffic and enforce transfer budgets

Cold ordering visits still exceed the required 200,000-byte budget. This draft removes unnecessary offline-page bootstrap/full-font downloads and unused italic preloading, while preserving intended theme fonts and offline retry. The task is unfinished: complete HTTP wire totals are 399,416 bytes for the table form and 387,293 bytes for the menu. The real local slow-4 G order-to-board test now passes, while its CI gate remains unfinished.

## Changes

- The public offline fallback is native HTML with validated theme tokens, fixed escaped copy, original-path retry and home navigation. It contains no guest data, Next Flight or client bootstrap.
- Four content-hashed font subsets cover the exact offline copy, retaining 400–600 weights for every approved family and valid custom body/display assignments. The 28,084-byte combined asset set preserves licensed font records and canonical metric fallbacks. Generation and source/output hashes are documented.
- The worker permits only known hashed offline-font paths. Private/scanner rules remain unchanged; its cache version advances.
- Cormorant retains its normal/italic and complete Unicode faces, but loads rendered styles on demand instead of eagerly downloading italic on plain order pages.
- A passive loopback HTTP forwarder counts response headers, framing and bodies, including the worker bootstrap Chromium reports aszero. It does not rewrite/compress responses or warm caches. Browser measurements remain diagnostic.

## Actual evidence

- Production builds pass. Offline foundation 44 focused tests and quicklint/types 54 related tests pass.
- Cold offline production journeys pass 2/2: all four themes, intended loaded fonts, axe,375/768/1280 overflow checks and reconnect/retry preserving the original path.24 screens: `docs/reviews/TICKET-081/offline-mobile/` and `offline-desktop/`.
- Preload change:5 font asset tests and 4 real browser checks pass, including no-JavaScript light/dark rendering, non-Latin fallback and glyph equivalence at all approved weights.
- Two focused byte-counter tests pass, proving exact chunked worker-script bytes and rejecting nonloopback/TLS guessing.
- Strict complete-wire budget tests fail 399,416/387,293 against 200,000. Raw actual trace attachments: `docs/reviews/TICKET-081/wire-{table,menu}.json`.
- Earlier browser-reported totals fell from~1.24 MB to~368/359 KB, but those numbers undercounted the worker script. Same-run complete-wire evidence exposes 28,725 missing bytes percase. These older figures are not a budget pass or deployment measurement.

## Remaining work and risks

Reduce remaining runtime/font traffic without losing behavior; wire the verified local delivery test into CI; wire both gates into CI; finish independent review. Measurements use local HTTP/1 and do not certify production HTTP/2/TLS, physical devices or reception conditions. No acceptance criterion is claimed complete merely from these reductions. No Realtime proof exists yet.

Rollback restores the previous Next offline page/worker policy and font preload setting. There is no migration or private-cache format change. Generated fixed-copy fonts must be regenerated if offline text or source fonts change; they must never be used for arbitrary guest names.

## Actual slow-4 G delivery fixture

A fresh owned managed Supabase stack was started and migrated; no collaborator
stack was touched. Production rebuilt with its real Realtime public config.
New e 2 e/order-delivery.spec.ts uses a real guest submission, separate real PIN
kitchen sign-in, confirmed Live subscription, both contexts throttled before
connections (150 ms latency,1.6 Mbps down,750 kbps up), visible persisted single
order and matching actual WebSocket broadcast before display. Native PostgreSQL
without realtime.send is explicitly refused.

First run measured 356.9 ms but failed the transport proof because the fixture
ignored binary frames. Installed Supabase serializer confirms UTF-8 event/JSON
inside binary frames; the fixture now observes both encodings without relaxing
the matching order UUID/before-visible requirement. Final actual test passed 1/1
(9.5 s runner), retaining strict elapsed<2000 ms. Its exact passing elapsed value
was attached in memory but not retained by the list reporter, so only the passing
bound is claimed. A subsequent evidence-only change writes sanitized timing
JSON after all assertions for future runs; this artifact is not fabricated.
Managed stack stopped with backup preserved after verification. Byte requirement
remains failed; CI wiring and final current-base review still outstanding.
