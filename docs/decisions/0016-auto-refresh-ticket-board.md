# ADR 0016: Auto-refresh the board locally

Status: proposed for review in TICKET-190.

A snapshot requires regeneration and cannot show collaborators' claims automatically. Keep the existing shared Git ledger and local definitions, but add a loopback-only, read-only HTTP process. The default dashboard command starts this process; a separate snapshot command preserves the previous offline export.

A debounced directory watcher and a 20-second timer invoke the JSON snapshot loader through an asynchronous child process. Only one refresh runs at a time, with a 12-second timeout and no interactive Git prompting. This preserves the existing ledger parsing/overlay behavior without blocking the HTTP event loop. Failures are visible; errors retain the last valid board and transport details are not sent to the browser. Offline CLI fallback is explicitly labelled as local file state. The browser polls every two seconds and applies data without reloading, preserving interaction state.

The process binds 127.0.0.1 only and accepts same-origin GETs for the page and data. It provides no file server, mutation endpoints, authentication proxy or public access. Each collaborator's own Git credentials handle their ledger reads. Never automatically pull/merge branches: definitions and uncommitted edits belong to that checkout. Readiness/claim writes remain in the existing atomic CLI.

An optional VS Code folder-open task uses normal workspace-trust and automatic-task consent, without changing global settings. Multiple checkouts can use different ports. No new packages, accounts, database migration, CI change or hosted service. Snapshot exports remain under ignored artifacts and handoffs remain per-ticket, so refresh cannot recreate generated-board merge conflicts.

Tests exercise loopback request restrictions, background refresh responsiveness, file watching, periodic refresh, failure recovery, cleanup and browser state preservation. Hosted sharing and automatic GitHub PR-status reconciliation remain separate work. Rollback can restore the snapshot default; ledger data and ticket definitions are unchanged.
