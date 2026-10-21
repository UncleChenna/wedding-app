# Ticket

TICKET-190

# Summary

The ticket board previously required manual regeneration. It now watches local ticket files and refreshes shared ledger state automatically, preserving the reader's filters, theme and open ticket details. Each collaborator runs the board with their own Git credentials.

# Changes

- Make pnpm t:dashboard a read-only loopback server; preserve export as pnpm t:dashboard:snapshot.
- Load snapshots asynchronously with a 12-second timeout, no credential prompts and one refresh at a time. Watch local edits and check the ledger every 20 seconds; browser polls every two seconds.
- Expose connection state, last successful refresh, checkout and base. Retain valid data on loader failures and reconnect automatically.
- Restrict HTTP to local same-origin GET board/data endpoints, without serving arbitrary files or mutation endpoints.
- Add optional VS Code folder-open task, collaborator setup and ADR 0016. Do not write generated board data or shared progress logs.

# Acceptance criteria and evidence

All five ticket criteria are complete. Three server tests cover request restrictions, nonblocking refresh, watcher/timer updates, cleanup and recovery. Browser tests cover changed ticket state while details stay open, retained filters/theme, focus restoration and both ledger/server outages. Snapshot export and an actual shared-ledger read of all 190 tickets were manually verified. The optional task is configured and documented; actual editor consent remains a user action.

# Verification

pnpm verify:quick passed. pnpm verify passed: 115 unit tests, format/lint/type checks, ticket validation, production build and 23 browser tests with 7 existing conditional skips. Run used public .env.example values and PW_PORT=3198. An initial narrow-screen overflow failure was fixed with checkout-path wrapping before the successful full run. No physical-device or VS Code desktop session was tested.

# Risks and rollout

No database, CI, dependency or service changes. The server is local to each machine; port collisions can use --port 4174. Git access must already work without prompts. Offline ledger fallback is explicitly labelled and can show local-file status; malformed snapshots/timeouts retain prior valid data. New ticket definitions still require a manual pull; no automatic branch merges occur. Refresh reads Git state but writes no tracked artifacts, avoiding the previous generated-board conflicts. Existing source-code conflicts remain possible.

After merging, install dependencies normally and run pnpm t:dashboard or approve the repository's optional automatic task in VS Code. Rollback: stop the task and use pnpm t:dashboard:snapshot, or revert this ticket. No data migration is necessary.

# Screenshots

Six inspected captures: [TICKET-190 UI review](https://github.com/UncleChenna/wedding-app/blob/TICKET-190/docs/reviews/TICKET-190/README.md), with screenshots in docs/reviews/TICKET-190/screenshots for Ivory & Gold and Midnight & Champagne at 375/768/1280.

# UI checklist

Scoped PASS/N/A results and unverified checks are recorded in the linked review. Keyboard, focus, reduced motion, state preservation and responsive checks pass. Existing colours/components remain unchanged. Guest Lighthouse, sharing, QR and staff-device checks do not apply to this local developer page.

# Harness changes, if any

Read-only dashboard command and snapshot alias, optional workspace task, JSON export mode, usage instructions and a per-ticket handoff. No status transition rules, hooks, CI or shared progress history changed.
