---
id: TICKET-193
title: Return the network response when caching an asset fails
epic: pwa
status: in_progress
priority: high
estimate: S
labels: [pwa, frontend]
module: shared
owner: unclechenna
agent: claude
blocked_by: [TICKET-105]
blocks: []
branch: TICKET-193
pr: ""
created: 2026-10-25
updated: 2026-10-25
started: 2026-10-25
completed: ""
reason: ""
resume_to: ""
---

# TICKET-193: Return the network response when caching an asset fails

## Context

Review of PR #21 (TICKET-105) found that the service worker awaits `cache.put` before returning a fetched asset. `cache.put` rejects for partial (206) range responses, such as media, and when storage quota is exhausted; that rejection fails `respondWith` and so the asset load itself. Caching must be best-effort and never break the page. See: [Tech stack and architecture](../docs/prd.md#tech-stack-and-architecture) · [Connectivity plan](../docs/prd.md#connectivity-plan-signal-unknown).

## Scope

- Only store complete `200` responses; skip 206 and other statuses.
- Treat a failed `cache.put` as non-fatal: always return the network response.
- Same for a failed `caches.open`/`match`: fall back to the network.

## Out of scope

- Cache eviction and quota management (TICKET-184).

## Acceptance criteria

- [x] A 206 response is returned to the page and not stored (unit test on the served worker).
- [x] When `cache.put` rejects (quota), the asset response is still returned (unit test).
- [x] When Cache Storage itself throws, the request falls through to the network (unit test).

## Test plan

- Unit: run the served worker script in the sandbox with failing cache doubles.
- End-to-end: existing `e2e/pwa.spec.ts` still passes.
- Gate: `pnpm verify` passes.

## Files likely touched

- `src/modules/shared/server/service-worker.ts`
- `src/modules/shared/__tests__/service-worker.test.ts`
- `docs/pwa.md`

## Notes / decisions

- 2026-10-25: Raised by the PR #21 review; classified as a real user-facing failure, so fixed promptly.
- 2026-10-25: Fix: cache lookup wrapped (errors fall through to the network); network response returned immediately; copy stored in the background via event.waitUntil only for status 200, basic, non-redirected responses; storage errors swallowed. Previously `response.ok` also stored 206 partials and an awaited put rejection failed the load.
- 2026-10-25: Evidence: three new unit tests run the served worker with a 206 response, a rejecting put and a throwing caches.open; all failed before the fix and pass now (22 worker tests). e2e/pwa.spec.ts still passes. `pnpm verify` passed on develop 5725c80: 200 unit tests, build, 40 browser tests.

## Activity log

- 2026-10-25 — new → todo — unclechenna (claude)
- 2026-10-25 — todo → claimed — unclechenna (claude)
- 2026-10-25 — todo → in_progress — unclechenna (claude)
