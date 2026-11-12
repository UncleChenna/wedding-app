# Ticket

TICKET-180

# Summary

A worker update must not strand or erase offline admissions. The queue reader
previously pinned IndexedDB version 1, so an additive database upgrade prevented
older compatible code from reopening the journal. Updates also lacked a shared
queue-safe activation protocol for the upcoming prompt.

# Changes

- Open the current IDB version and close on version changes; preserve strict journal validation.
- Add waiting-worker status/activation messages under the existing scanner lock. Defer for all pending/rejected/operator events; broadcast the same state to all tabs.
- Keep incompatible storage from triggering activation cache cleanup or private snapshot invalidation.
- Exercise actual N/N+1 worker scripts, tab closure/reload, additive schema migration, rollback, interrupted upgrade and repeated HTTP acknowledgements in Chromium and WebKit.
- Register the new upgrade tests in the existing CI offline-queue suite; consuming prompt UI remains TICKET-111.

# Acceptance criteria and evidence

Four actual-browser cases pass across both engines (final run: 10.2 seconds). Exact queued IDs remain after
upgrades/reloads/rollback; acknowledgements from the HTTP fixture produce exactly
two receipts after repeated delivery. Unsupported journals retain old caches even
after all tabs close and a new worker activates naturally. Multi-tab broadcasts
and refusal of caller-supplied safety overrides are asserted.

# Verification

- Focused guard/shared/scanner worker unit tests: 60 passed.
- Quick verification: lint, types and 73 related tests passed.
- Actual upgrade browser suite: 4 passed, including explicit multi-tab broadcasts and legacy reader rejection. Existing queue/store/worker suite: 22 passed before the final cleanup-lock review fix; final focused upgrade cases rerun afterward.
- Initial real Chromium test exposed a skipWaiting/activation lock deadlock; fixed by awaiting activation outside the lock. Both engines then passed.
- Existing pass-worker unit fixture required real multi-listener event behavior; all existing assertions remain.
- Independent review found a compatibility-read/cleanup lock gap; the guard now holds the lock through the entire cleanup and private activation, with a regression test. The final independent re-review is clean. Integrated develop `ddc81755` without conflicts; final selected CI remains required before merge.

# Risks and rollout

No SQL migration, dependency or production data operation. No queue data is
removed by an upgrade. Older pre-180 code pins IDB version 1, so it is not a valid
rollback target after a future higher IDB schema migration. This ticket changes
no production IDB version. Future migrations must retain the version-1 journal;
incompatible format changes require a separately verified migration path.

The visible update prompt remains TICKET-111; this ticket supplies its tested
activation API. Browser lifecycle can activate a compatible worker after all tabs
close, preserving IDs but potentially requiring online sign-in before sync. No
physical-phone QA is claimed. HTTP acknowledgements in the focused fixture are
idempotent test-server responses; TICKET-066 retains real authenticated database
reconciliation coverage.

# UI checklist

No visible UI change. No screenshot or manual-device completion claimed.
