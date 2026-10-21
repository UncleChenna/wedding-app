## Summary

Add per-request correlation for future Server Actions and fix two logger gaps: fields could replace a request ID, and objects beyond the redaction depth limit were emitted without redaction.

## Changes

Add server-only runLoggedAction, validating an incoming x-request-id or generating a UUID. Each invocation receives an independent child logger and static lifecycle messages; arguments, results and exception text are not logged automatically. Preserve handler results and thrown objects. Pin request IDs in children/message fields and truncate deep objects. Document safe adoption and key-based redaction limits.

## Acceptance criteria and evidence

Unit tests assert each action lifecycle/handler/child record has the correct request ID, including concurrent calls. Tests cover nested token redaction, invalid/oversized/missing IDs, fresh UUIDs, unmodified domain results and thrown errors without private exception text. There are no feature Server Actions in the bootstrap, so this supplies the shared integration point rather than adding a product endpoint.

## Verification

Initial logger regressions: 2 failed, 5 passed. Focused logging suite: 17 passed. Quick gate and full pnpm verify passed: 116 unit tests, production build, 17 smoke passes, 7 existing skips. No UI changes; screenshots N/A. Live feature-action journeys remain future work.

## Risks and rollout

Request IDs are untrusted correlation metadata, never authorization. Key-based redaction cannot identify secrets hidden in free text; use fixed messages and selected safe fields as documented. Existing log-level filtering applies. Future actions must explicitly adopt the wrapper. No dependencies or schema migration; revert this ticket's implementation commit to roll back. Earlier unmerged harness/workflow history is included; focused changes follow 5506f63. Human review and merge only.
