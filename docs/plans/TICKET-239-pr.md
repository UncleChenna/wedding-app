## Summary

Investigate intermittent camera/reconciliation failures in the real two-offline-scanner CI journey. Capture useful failure state before custom browser contexts are closed; keep existing product and admission assertions unchanged.

## Changes

Add bounded synthetic-only diagnostic attachment with scanner/scan phase, online/controller/visibility state, visible headings/statuses/buttons and sync HTTP statuses. No invitation tokens, signing keys, PINs, request bodies or journal identities are recorded.

## Acceptance criteria and evidence

Run43388307715 failed desktop camera-result waiting, then retained50journal entries during retry. Existing trace/screenshot recording is disabled and custom contexts close before Playwright captures DOM. Diagnostic instrumentation addresses that evidence gap; the underlying cause remains unconfirmed, so this PR stays draft.

## Verification

Production build passes. Both original two-scanner mobile/desktop cases passed locally in 43.6 seconds with unchanged 50 QR scans, 100 original-event reconciliation, reload equality, shared allowance conflict and replay checks. Hosted run43400118523 attempt2 also passed. Attempt1 failed before tests because Docker port54322 was already occupied; the unchanged failed-job retry passed. No timeout, assertion or limit changed.

## Risks and rollout

Test diagnostics only; no runtime/schema changes. No claim of fixed product behavior or real-phone certification. PR113 was subsequently merged externally. The earlier runtime failure remains unexplained; this diagnostic PR stays draft and does not certify that intermittent reconciliation is fixed.
