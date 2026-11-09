# Ticket

Ticket: TICKET-173

# Summary

Gate phones keep scanning when the venue Wi-Fi drops, so they need somewhere to upload those scans when they
reconnect. This adds `POST /api/checkin/sync`: the server half of offline reconciliation.

- The guests a device let in are already inside, so every reported scan is kept as evidence.
- Only the canonical admission count is held to the invitation's RSVP allowance.
- If two offline phones each admit the same party of four, all eight reports are kept, four are counted, and the
  second one is flagged as a conflict for the admin review in TICKET-067.

# Changes

- **`src/modules/checkin/lib/scan-sync.ts`** (new):
  - the batch schema: 1 to 200 events
  - `reconcileScan`, the pure rule for what one report counts for, built on `decideAdmission` from TICKET-058:
    - within the allowance: counted in full
    - over it: counts what remains (possibly 0), flagged `conflict`
    - a valid report the server would refuse (revoked, unknown, not RSVP'd): counts 0, flagged
    - a refusal the device showed: counts 0, not flagged
- **`src/modules/checkin/server/reconcile-scans.ts`** (new), `reconcileScanBatch`:
  - Each event gets its own transaction, in upload order. An acknowledgement therefore always means a commit, and
    one failing event never discards the others.
  - Each transaction rechecks that the staff member and device still have gate access. A revocation stops the rest
    of the batch, answered `retry`.
  - It locks the invitation first (the order the admission triggers use), reads the RSVP and the current count, then
    inserts the `scan_events` row. The existing trigger updates `admission_counters`, and its `admitted <= allowance`
    check remains the backstop.
  - **Replays:** an id seen before from the same device with the same scan is `duplicate`, answered with the stored
    result. The same id with a different scan, or from a different device, is `rejected`.
  - An insert that loses a race on the same id is answered from the committed row.
  - An unknown invitation id is stored as unmatched evidence (`invitation_id` null, flagged), and its retry still
    matches.
- **`src/modules/checkin/server/scan-sync-response.ts`** and **`scan-sync.ts`** (new), and
  **`src/app/api/checkin/sync/route.ts`**:
  - **Access:** the live staff, device, credential and event-expiry check (`currentStaffDevice("gate")`) runs before
    the body is read. The proxy already guards `/api/checkin/*`.
  - **Refused requests:** malformed or duplicate-id batches get 400, bodies over 128 KB get 413.
  - **Success:** one acknowledgement per event, plus `signedOut` if access ended mid-batch.
  - **Storage failures:** a plain 503 that tells staff the scans are still on the phone. No technical detail is
    returned, and responses are `private, no-store`.
- **`src/modules/checkin/README.md`:** the sync contract.

# Acceptance criteria and evidence

- [x] **Authorize staff/device batches; merge transactionally on a unique client event id; an identical retry is a
      no-op; the same id with a different payload is rejected.**
  - The route refuses signed-out or expired requests before reading anything (unit test).
  - Integration tests:
    - an identical retry is `duplicate`
    - a changed people count, or the same id from a second device, is `rejected`
    - after all three, there's still one row and the count is 2
- [x] **Persist every attempted scan and its reported time and result, keeping canonical admissions bounded.**
  - Every upload stores `reported_at`, `reported_result` and `reported_people` next to the canonical `result` and
    `admitted_people`.
  - Six concurrent devices each report 2 for a party of 5: 12 reported, 5 counted, the counter at 5, and at least
    one flagged.
- [x] **Two offline devices each report four for a party of four: keep all eight, count four, flag the conflict.**
  - Run concurrently: 8 reported, 4 admitted, exactly 1 conflict, counter 4.
  - The same scenario over HTTP gives the same totals after each batch is uploaded twice.
- [x] **Concurrent requests and partial failures never lose events or acknowledge an uncommitted write; return
      per-event acknowledgements and conflicts.**
  - **Commit failure:** the second event's transaction inserts its row and then fails before commit. The answer is
    `recorded, retry, recorded`, and the row isn't in the database. Resending gives
    `duplicate, recorded, duplicate`, ending at 3 rows and 3 counted.
  - **Same upload three times at once:** one row, answered once `recorded` and twice `duplicate`.
  - **Revoked device:** every event is `retry` with `revoked: true`, and nothing is stored.

# Verification

- `RUN_SCAN_SYNC_DB_TESTS=1 vitest run scripts/__tests__/scan-sync.integration.test.ts` against this worktree's
  local stack, migrated to develop `b1a15b64`: 8 passed on three consecutive runs.
- `vitest run src/modules/checkin/__tests__/scan-sync.test.ts`: 10 passed (rule, schema, route responses).
- `pnpm typecheck` and ESLint on the changed files: clean.
- `vitest run src/modules/shared scripts/__tests__`: only `ci-parity.test.ts` fails. That's develop's known break
  from TICKET-057, fixed by #131 (TICKET-221), and this PR's `pnpm verify` stays red until it merges.

# Not tested and limitations

- **No browser end-to-end test:** the scanner UI and device queue come in TICKET-059 and the following tickets. The
  "end-to-end" replay runs at the HTTP layer (a real `Request` through the response handler into the real database)
  rather than in a browser.
- **CI doesn't run the database tests:** like the other `RUN_*_DB_TESTS` suites, they need a local stack.
- **Pass version isn't stored on `scan_events`:** a retry that differs only in pass version counts as a duplicate.
- **No rate limit on the endpoint:** it's gate-only, behind a live staff session and device check.
- **Test fixtures stay behind:** each run commits its fixtures, because `scan_events` is append-only. `pnpm db:reset`
  clears them.

# Risks and rollout

- No migration or schema change: it uses the TICKET-024 tables and triggers as they are.
- Nothing calls the endpoint until the scanner's sync queue is built.
- **Rollback:** revert the PR.

# Screenshots

N/A: no UI.

# UI checklist

N/A: no UI.

- [x] **Verification:** see above.

# Harness changes, if any

None.
