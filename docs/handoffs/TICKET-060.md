# TICKET-060 — 2026-11-09

Owner divine/codex; branch TICKET-060. Draft PR139:
https://github.com/UncleChenna/wedding-app/pull/139.
Integrated develop d0231fadf959f64ad4da7a010436b84c9b5d60e4 (059).

## Implemented

Actual Scanner resolves a scanned same-origin signed pass through the live,
auth-first POST /api/checkin/read. Signature verification precedes lookup; live
staff authorization is checked again after lookup. Repeatable-read minimal data
includes current seating, canonical admitted count and accepted event history.
No dietary/contact/PIN data or raw credential reaches result HTML. History uses
server-receipt UTC and current staff/device labels, with explicit missing fallbacks.
No scan/admission is written. A valid pass explicitly says no admission recorded.
Camera stops once the result arrives, the viewfinder collapses, focus moves to the
result, and Scan next pass clears it before restarting. Stale callbacks cannot
restore/clear the newer result. Optional feedback cannot block the visual result.

061 owns atomic admission and post-commit welcome/enter wording; 062 owns all-result
logging; 065 owns persistent cached guest data; 108 owns offline shell/session expiry.
No duplicate snapshot or expiry policy was added. The cached timing criterion is
proved separately by actual camera pixels, real signatures and synthetic cached
rows in Chromium/WebKit; the production reader currently requires connectivity.

## Verification so far

- Foundation19 tests, new focused45 tests pass; final full coverage running.
- Actual cached camera fixture12/12 passes7.8s; each paint-to-result <1000ms.
  The next-pass fixture is blank, so reset is not raced by immediately scanning
  the same QR again. No delay/timeout assertion was relaxed.
- Isolated DB projection1/1 passes: real2+1 admission triggers, refused events
  excluded, current reassigned table, private-note omission, no additional writes.
- Production build passes. Actual mobile/desktop result+camera4/4 passes1.7m.
  Stronger final result2/2 passes34.5s: table-pointer reassignment, unassigned fallback,
  result focus,44px targets, six states × four themes axe and375/768/1280 bounds.
- Quick types/45 related tests pass; lint identified missing stable stop dependency,
  now fixed with useCallback and the correct dependency. Final quick pending.
- Screenshots docs/reviews/TICKET-060/{mobile,desktop}; independent reviewer098
  inspecting actual rendered states. Final source review/CI still pending.

## Database and remaining work

Owned native PostgreSQL16.14 only (not Supabase/Auth/realtime evidence), port30821,
project wedding-b9b56d3d34dc. Verified zero public tables before unchanged migrations.
Stopped successfully after browser checks; retained datadir is recorded in ignored
.harness/temporary-postgres-path. Synthetic append-only browser history remains;
no guard disabled or event deleted. Logs /tmp/TICKET-060-native-{empty.txt,migrate.log,stop.log}.

Finish coverage/quick, checkpoint and publish detailed PR. Physical camera/audio/
vibration checks remain unverified release gates in201. No production DB apply.

Final local full suite:1,615 passed,181 skipped,67.17s;98.27% lines/98.46% branches.
Final verify:quick passes lint/types/45 related tests (one conditional DB skip).
Both new pure modules reach100%; no thresholds or assertions weakened.
