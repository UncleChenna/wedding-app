---
id: TICKET-248
title: Prevent stale reconnect events from reopening a departed offline pass
epic: pwa
status: in_review
priority: urgent
estimate: S
labels: [frontend, pwa, security]
module: invitations
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: TICKET-248
pr: https://github.com/UncleChenna/wedding-app/pull/207
created: 2026-11-13
updated: 2026-11-13
started: 2026-11-13
completed: ""
reason: ""
resume_to: ""
---

# TICKET-248: Prevent stale reconnect events from reopening a departed offline pass

## Context

The [offline pass contract](../docs/prd.md) requires one guest's cached pass to remain isolated from another invitation URL. Hosted guest CI repeatedly returned to cached invitation A after navigating to uncached invitation B. A captured-document browser probe reproduced this without pressing Refresh: the old document receives a stale online event during departure and its unconditional listener reloads A. The runtime must ignore connectivity events for a document being left, while genuine reconnect still revalidates the pass.

## Scope

- Guard automatic saved-pass reconnect refresh with current connectivity and document navigation lifecycle.
- Keep manual keyboard/pointer Refresh usable offline and reset lifecycle state when a history-restored page becomes active again.
- Preserve exact cross-invitation URL/content isolation and real reconnect revocation checks.

## Out of scope

- Relaxing URL/privacy assertions, lengthening test timeouts, removing reconnect validation, changing cache ownership or extending pass retention.

## Acceptance criteria

- [x] A stale online event cannot reopen a departing saved pass or override navigation to another invitation.
- [x] Manual Refresh still reloads offline by keyboard and pointer.
- [x] A genuine reconnect on the active page still refreshes and removes a revoked pass; history restoration re-enables active-page reconnect handling.
- [x] Actual browser regression retains exact B URL/no-A-content checks and the existing revocation/cache-empty assertions.
- [x] Focused lifecycle tests and existing offline-pass tests pass with unchanged privacy thresholds.

## Test plan

- Unit: active online/offline events, departure events, pageshow restoration and explicit manual refresh.
- Browser: actual saved native pass, offline refresh, cross-invitation isolation and reconnect revocation; preserve screenshots under this ticket's artifacts rather than rewriting older evidence.
- Gate: normal quick verification, independent source review and required hosted CI.

## Files likely touched

- `src/modules/invitations/server/offline-pass.ts`
- `src/modules/invitations/__tests__/offline-pass.test.ts`
- `e2e/offline-pass.spec.ts`

## Notes / decisions

2026-11-13: Hosted reproduction run43412436934/job131842112552, TICKET-245 PR203. Temporary probe using captured synthetic native documents fails immediately without a refresh action; removing only the reconnect listener stops it. Persisted callback metadata records online event with navigator.onLine false. Connectivity check alone is insufficient during transient navigation; connectivity plus departure/pageshow lifecycle passed20 plain and20 keyboard-refresh transitions in the isolated probe. These are diagnostic results, not yet proof of an implemented product fix.

## Activity log

- 2026-11-13 — created for confirmed runtime reconnect defect.
- 2026-11-13 — todo → claimed — divine (codex)
- 2026-11-13 — todo → in_progress — divine (codex)
- 2026-11-13 — in_progress → in_review — divine (codex)
