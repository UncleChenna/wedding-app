## Summary

The ordering transfer test can hang in Chromium's supplemental request-size API after worker installation and network quiescence have already completed. Bound those diagnostic lookups while preserving the authoritative passive wire measurement and unchanged 200KB cap.

## Changes

- Keep every completed request identity, including worker requests; unavailable browser metadata has null bytes and an explicit timeout/rejection reason.
- Label the browser subtotal incomplete when necessary. No unavailable request is presented as a zero-byte transfer.
- Keep all actual traffic in the passive wire total, including fonts and worker bootstrap.
- Release proxy sockets even if context cleanup fails.

## Acceptance criteria and evidence

The failed CI trace from run43386213746 passes both1500ms quiescence checks and pendingBytes=0 around2seconds, then stalls before wire assertions in Promise.all of protocol diagnostics. The60second test timeout subsequently reports context.close, masking that earlier stall.

The focused regression covers exact success, rejection, never-settling protocol calls and rejection after timeout. Independent review found no blocker. All eight real transfer cases pass; exact JSON evidence is in docs/reviews/TICKET-237/.

## Verification

- Four diagnostic unit tests pass.
- Original raw200000byte limit, worker-presence assertion, actual worker/font traffic, readiness and network-quiescence checks remain unchanged.
- Production build passes on develop fe97f5f89183cfa7c934f6dad9eb7dae3f6b5257.
- Eight actual cold-transfer cases pass (22.1s), max182380bytes; all supplemental diagnostics available in this local run. The never-resolving failure is covered by the explicit unit regression.

## Risks and rollout

Test instrumentation only; no application/schema changes. Browser diagnostics may explicitly be incomplete; the raw socket measurement remains authoritative and complete. No timeout or budget is increased. Reverting restores the diagnostic hang risk. Screenshots/UI checklist not applicable.
