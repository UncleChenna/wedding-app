# Current checkpoint — 2026-11-12

Native ordering implementation is complete locally on base 1cc4f020. Final wire tests pass 8/8: maximum 181388 bytes including worker install, default light/dark and both viewports. Real Supabase slow-4G delivery passes 378.475 ms. Full original variable axes restored after rejected partial-axis experiment; font parity 48 cases per viewport passes. Worker gzip negotiated with unchanged cache/scope and reviewed by queue_upgrade. Final guest parity passes all 11 cases across focused retries; implementation pushed 19bc2f4e and full independent source review found no blocker. PR162 remains pending CI. See docs/plans/TICKET-081-pr.md for current scope/evidence.

Owned Supabase stopped with backup preserved. Lightweight native PostgreSQL `/tmp/TICKET-081-postgres.J2KPia` on 36761 is stopping with data retained after final browser verification. No collaborator stacks touched. Earlier evidence below is historical, superseded by native-wire-<project>-<scheme>-<state>.json.

# TICKET-081 — 2026-11-12 checkpoint

Owned branch/worktree TICKET-081; baseeb145497, claimed via supported --ahead while merged075 awaits verified closure. No product source changed. New opt-in e2e/order-performance.spec.ts exposes the genuine cold-transfer failure for table form and selected menu; expected200,000 vs1,239,803/1,227,649 actual. Production build passes. Exploratory raw request breakdown saved in docs/reviews/TICKET-081/cold-baseline.json. The first harness attempt lacked contextbaseURL; fixed before collecting these budget failures. No timeout or budget was increased.

Owned native PostgreSQL36761 (path in.harness/temporary-postgres-path) holds only synthetic performance fixtures and applied existing migrations. Production server36771 is a local measurement server. Other collaborators' Docker stacks are untouched. Native database is sufficient forbytes, not actual Realtime delivery; that needs the owned Supabase stack later.

Next: reduce eager offline font downloads and inspect framework/font cost before choosing changes; retain all-theme and offline behavior. Add real guest-submit to authenticated kitchen/bar visible arrival timing with documented slow 4G and strict<2s. Do not modify collaborator079's ordering work. Required CI gate not yetwired; draft only, no doneclaim.

## 2026-11-12 measured investigation

Direct imports for root ToastProvider, TableForm, MenuSections and OrderComposer
were built and measured with unchanged fonts/worker and the strict cold tests.
Results remained red:1,238,050 bytes table form and1,228,706 menu, versus200,000.
No consistent useful saving; substitutions reverted rather than shipping noise.
Patch retained locally /tmp/TICKET-081-direct-import-experiment.patch.

A separate worker regression proved CSS crawling downloads undeclared complete
fonts (1red/33green). Preload-only prototype passed34tests, but independent
review correctly noted Playfair/Jost are not HTML-preloaded: cold offline themes
could lose their intended faces. Entire prototype reverted, not committed as a
fix; patch /tmp/TICKET-081-offline-preload-prototype.patch. Do not waive fonts.

Client manifest points to global-error.tsx runtime theme validation as a consumer
of the32KB Zod chunk (alongside menu), while React/Next chunks are73KB+37KB.
Current actually used normal fonts are37KB Cormorant+49KB Inter, plusunused39KB
italic preload. Next: explicit minimal offline asset/font-subset contract and
validated error-theme build output/lazy boundary, then honest cold remeasurement.
A larger architectural change needs evidence, not an inflated budget or delayed
measurement window. Owned native DB36761 stopped with data retained; production
measurement server also stopped by Playwright. No Supabase or Realtime proof yet.

## 2026-11-12 bounded offline foundation

The generic offline route now returns a public native HTML document instead of
a Next bootstrap. It retains validated theme tokens, intended font families,
metric fallbacks, fixed copy, retry and home navigation. Four content-hashed
font subsets cover that exact copy and weights400–600 for every family, including
valid custom body/display assignments. Generated from existing licensed Latin
faces with pinned FontTools; final combined font payload28,084bytes. Worker
private/scanner handling and recursive CSS behavior remain unchanged; only the
explicit hashed offline-font paths were added and cache version bumped.

Production build passes;44 focused unit tests pass. Actual cold offline browser
tests pass2/2 with all four themes, intended loaded FontFace objects, axe,
375/768/1280 overflow checks and reconnect/retry preserving the original path.
24 screenshots live in docs/reviews/TICKET-081/offline-{mobile,desktop}.
Independent review found custom body roles needed400–600 on display families;
this was fixed before final generation and browser evidence.

Strict unchanged cold-transfer tests STILL FAIL:408,534 bytes table form and
399,213 menu, including worker install. This is a measured reduction from~1.24MB,
not completion of the200KB criterion. No Realtime/slow 4G delivery proof yet.
Next: reduce remaining client validation/default font preload cost, preserving
all theme contracts; incoming066 verifier adds~20KB gzip and must be measured.

Preload follow-up: kept both Cormorant normal/italic faces and their complete
Unicode fallbacks, but disabled eager preload of the paired registration.
Rendered text still requests the face it uses; plain order pages no longer
download unused italic. New measured totals367,825/358,539 bytes remain above
200,000. Existing font asset tests5/5 pass; actual browser checks4/4 pass for
no-JavaScript light/dark themes, non-Latin fallback and subset glyph equivalence
at every approved weight. Production build passes. No actual-font substitution.

## Complete HTTP wire accounting supersedes browser-reported totals

Chromium reports the200service-worker bootstrap body aszero, so the earlier
request.sizes totals undercounted actual transferred bytes. The budget now uses
a passive loopback TCP forwarder: unchanged upstream HTTP responses, including
headers, chunk framing and worker script bytes, with fresh context/origin and
settled drained sockets. Browser sizes remain diagnostic; no compression, warm
cache or request exclusion is introduced. This measures local HTTP/1, not a
claim about a deployed HTTP/2/TLS transport.

Current complete totals399,416 table /387,293 menu remain RED against200,000.
Same-run browser totals370,691/358,568 each missed28,725bytes. Raw evidence
extracted from actual Playwright trace attachments: wire-table.json and
wire-menu.json in docs/reviews/TICKET-081. Two focused countertests prove exact
chunked worker-script response bytes and reject guessing nonloopback/TLS.
Build passes; owned nativeDB stopped retained. No completed budget or delivery
claim. Low-value generated-error-CSS experiment (~3KB reduction) reverted.

## Actual slow-4G delivery fixture

A fresh owned managed Supabase stack was started and migrated; no collaborator
stack was touched. Production rebuilt with its real Realtime public config.
New e2e/order-delivery.spec.ts uses a real guest submission, separate real PIN
kitchen sign-in, confirmed Live subscription, both contexts throttled before
connections (150ms latency,1.6Mbps down,750kbps up), visible persisted single
order and matching actual WebSocket broadcast before display. Native PostgreSQL
without realtime.send is explicitly refused.

First run measured356.9ms but failed the transport proof because the fixture
ignored binary frames. Installed Supabase serializer confirms UTF-8 event/JSON
inside binary frames; the fixture now observes both encodings without relaxing
the matching order UUID/before-visible requirement. Final actual test passed1/1
(9.5s runner), retaining strict elapsed<2000ms. Its exact passing elapsed value
was attached in memory but not retained by the list reporter, so only the passing
bound is claimed. A subsequent evidence-only change writes sanitized timing
JSON after all assertions for future runs; this artifact is not fabricated.
Managed stack stopped with backup preserved after verification. Byte requirement
remains failed; CI wiring and final current-base review still outstanding.
