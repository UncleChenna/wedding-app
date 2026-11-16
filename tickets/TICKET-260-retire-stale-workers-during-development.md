---
id: TICKET-260
title: Retire stale production workers during local development
epic: foundations
status: in_review
priority: high
estimate: S
labels: [bug, pwa]
module: shared
owner: "chenna"
agent: ""
blocked_by: []
blocks: []
branch: "TICKET-260"
pr: ""
created: 2026-11-15
updated: 2026-11-15
---

# TICKET-260: Retire stale production workers during local development

## Context

An installed production worker can cache development chunks with stable URLs. Browser logs show old toast exports and markup alongside new server markup, causing sign-in to crash even after server cache resets.

## Acceptance criteria

- [x] Development HTML retires only the app-owned root worker before React hydration; a controlled tab reloads onto the network.
- [x] Development `/sw.js` never installs production caching and needs no scanner manifest.
- [x] No Cache Storage, IndexedDB or pending check-in records are deleted.
- [x] Production retains its existing offline worker and guarded update behavior.

## Test plan

- Unit: owned versus unrelated workers, failed unregister, reload behavior and no-cache response.
- Browser: seed a cache-first worker with a stale chunk, reload sign-in, confirm recovery and preservation of offline storage.
- Quick and full verification.

## Evidence

[Recovery review](../docs/reviews/TICKET-260/recovery.md). Production worker tests and full verification pass. Browser regression confirms stale-code recovery and offline storage preservation.
