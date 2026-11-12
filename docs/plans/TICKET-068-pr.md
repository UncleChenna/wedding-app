# Ticket

TICKET-068

# Summary

A gate scanner now refreshes its displayed pass when another scanner records an arrival. Private Broadcast notifications invalidate the saved guest list and fetch authoritative state; independent five-second polling continues when Realtime is unavailable. An unresolved admission keeps its original request ID and receipt workflow throughout refreshes.

# Changes

- Publish the existing minimal gate notification inside the admission/reconciliation transaction, after a new evidence insert. Replays do not publish; rollback removes the notification and evidence together.
- Integrate the existing snapshot invalidation acknowledgement and session-denial barriers. Notification counts never become canonical local counts.
- Refresh the current displayed result without rescanning, fencing stale QR/revision responses. Pending or uncertain admissions show a changed-state notice and preserve exact retry identity.
- Pass only public Realtime configuration into the standalone offline scanner shell; old shells retain polling fallback.
- Extend the existing isolated Supabase CI job with transaction publication and actual two-context scanner tests.

# Acceptance criteria and evidence

- [x] Device A admission updates device B's visible pass within two seconds without rescanning: real private WebSockets, both browser projects.
- [x] Blocking device B's WebSockets still updates within fifteen seconds: actual five-second polling, both projects.
- Additional lost-response regression commits the admission, loses its receipt, receives the broadcast and retries the identical event ID; exactly one positive admission persists.

# Verification

- Actual Supabase:15 admission/reconciliation/publication tests and4 existing private-channel authorization tests passed. Broadcast tests reproduced missing messages before implementation; replay and rollback assertions remain.
- Actual production browser:6/6 passed across mobile and desktop, all four themes axe-zero, no horizontal overflow375/768/1280.24 screenshots inspected without clipping or overlap.
- Production build passed. Focused boundary/controller/scanner tests passed.
- Full unit/coverage after freshness fix:1993 passed,207 conditional database skips,95.69s. Critical coverage98.71% lines/98.96% branches.
- Quick verification passed lint, types, related tests and workflow/environment CI parity.
- Final enhanced browser6/6 passed33.2s, including keyboard Enter retry,44px buttons and actual standalone offline reload/reconnect. Live updates measured120/70ms, polling2863/3360ms, uncertain notices125/123ms (mobile/desktop); exact JSON saved beside screenshots. Final combined-head CI remains required before merging.

## Review and CI repairs

Independent review identified stale cached replies crossing completed invalidation. Two regression tests cover delayed storage and signature resolution; generation checks now fail closed at both boundaries (nine boundary tests pass). The reviewer confirmed the fix clean.

Hosted CI exposed wrong inherited database defaults and obsolete network-idle waits. The runner now explicitly combines generated managed configuration with identity guards. Actual tests under conflicting CI defaults pass: two publication SQL tests and six synchronization browser cases. Existing scanner lifecycle2/2 and offline2/2 pass with exact-zero CLS retained after fonts/rendered-frame readiness. The full-suite refresh passed1993 tests. Subsequent integrated CI revealed background updates stealing duplicate receipt focus; a red regression reproduced it and a one-shot new-scan focus fix passes14 scanner tests, independent review and the exact production admission journey2/2 (61s). Final combined-base CI remains pending; no failing run is represented as green. On verified develop2a0cf958, five bounded scanner/controller/freshness/frame-reader suites pass58 tests (2.39s). All144 regenerated admission captures were inspected across six states, both browser projects, four themes and375/768/1280; no clipping, overlap or new visual blocker. The verified upstream decoder bytes are unchanged. A redundant supplementary camera rerun was interrupted on coordination instruction (exit130), is not completion evidence, and was not replaced with weakened checks.

# Risks and rollout

No migration, policy, production application or external guest message. Broadcast availability requires the existing private station policies and configured public Supabase endpoint. A failed refresh preserves explicit snapshot/session safety restrictions rather than inventing admission counts. Physical phones, venue-network timing, fresh Lighthouse and CLS are unverified release checks; this browser evidence does not replace them. Verified decoder follow-up158 is now integrated from develop2a0cf958, along with navigation157 and current ordering changes. Verified targeted-CI workflow227 is integrated from developaf819983. Its conservative workflow/tooling classification selects full verification for this PR; the scanner SQL/browser gates are retained in the real-Supabase admin job.

# Screenshots

`docs/reviews/TICKET-068/{mobile,desktop}/`: realtime, polling and uncertain-response states in ivory-gold, emerald-night, blush-sage and midnight-champagne.

# UI checklist

PASS: all-theme automated accessibility, responsive overflow checks, visual inspection and reduced-motion browser setting. PASS: keyboard retry and44px button bounds. Physical-device checks and fresh performance/CLS measurements remain release-gated, not certified complete.

# Harness changes, if any

The existing real-Supabase admin CI job additionally runs the two gate-publication SQL tests and six scanner browser tests, then uploads screenshot/timing evidence. No test, timeout, security policy or threshold was weakened.

## Final manual-search integration

All ten CI jobs passed on head `25473c9d` (run `43207911754`), including full verification and the real two-scanner tests. Before merging, `develop` advanced to `9c24504f` with verified manual guest search. The integration preserves the manual search branch and admission callbacks alongside snapshot invalidation, visible QR refresh revisions and pending-intent fencing. Both test mock sets remain, and scanner screenshots retain the configurable review directory with the new manual-search default. Five focused interaction suites passed 48 tests in 2.48 seconds. This integrated head requires its own CI; the earlier green run is not presented as proof of the new combination.
