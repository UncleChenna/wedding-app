# TICKET-091 handoff — 2026-11-09

Ownerdivine, agentcodex, branchTICKET-091, isolatedworktree. Started with--ahead
of182inprogress after090done, baseddevelopb5fa06c9. No priorhandoff existed.
Rootsoleeditor. Backend publiccontractin182/lib/guest-import.ts and planned
server/guest-import-actions.ts; no copiedbackendimplementation. Build standalone
UI/viewmodelwithinjectedactions until182merges. No DBstarted. Nextcomponenttests
first, thenprivatepageadapterandbrowserintegrationafterdependencyready.

## UI checkpoint

Nine component tests pass: invalid rows, explicit confirmation/replay, file-change invalidation, delayed response, stale commit, read failure, file size, expiry and expiry during commit. The last regression failed before the fix; expiry now pauses during commit and success clears prior error state. Display-only view model is separate from182parser/services. Strict256KB UTF-8 reading. Quick lint/types and related tests pass. No production page/adapter or DB started; next integrate182 after merge and run real browser/database flow.

Draft PR: https://github.com/UncleChenna/wedding-app/pull/125. Eleven focused tests now pass, including strict UTF-8/BOM decoding and malformed-byte rejection. Confirmation tests wait until the preview action has settled before clicking the enabled import button; fake-clock expiry/commit regression remains explicit. Quick verification passes. No production route or backend adapter yet.

## Browser harness prepared (not yet run)

Added opt-in `scripts/test-guest-import.ts` / `e2e/admin-guest-import.spec.ts` for
real admin OTP/TOTP, malformed middle row and contact conflict before writes,
300-row import, repeat replay and preservation of existing RSVP. It also captures
preview/error/success across themes and checks layout, typography and keyboard.
This harness only passes after the real page and TICKET-182 are integrated;
it has not run yet. Quick lint/types pass for the prepared harness. DB remains
stopped; backend182 owns any isolated verification while its CI is pending.
