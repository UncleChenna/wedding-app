# TICKET-036 — 27 October 2026

Owner divine; agent codex; branch TICKET-036. Base fdfa3ab716918a9ea3c9ed6dff088db795eeecf6. PR: https://github.com/UncleChenna/wedding-app/pull/42. TICKET-023 PR41 is merged and recorded done.

## Current state

Implementation pushed in d33f7fd; final t:pr gate passed and moved the ticket to in_review in db1c432. All three acceptance criteria have evidence. Await required GitHub checks on the final documentation commit, then merge under the user's standing authorization and record completion through the CLI. Do not claim completion before that merge.

## Result

256-bit URL-safe tokens with bounded atomic collision retries; Drizzle draft creation and guest-only field projection; published-token Proxy check before streaming; personal /i/[token] page with confirmed names/date and honest pending venue/RSVP/pass details. Unknown/draft/revoked tokens get the same neutral 404, not a streamed 200. Private no-store/no-referrer/noindex headers. No migration, RLS, dependency or CI changes. Full invitation design remains TICKET-037.

## Verification

- Token/resolver suites first failed on missing modules, then 20 tests passed (10,000 samples, input bounds, collision retries, outage propagation, safe fields/statuses).
- Real isolated PostgreSQL lifecycle tests first failed on missing repository, then both passed; fixtures roll back.
- Browser valid-token test first returned 404 before route implementation. Production checks then passed real valid/unknown/revoked statuses, privacy headers and revocation after an earlier visit.
- Twelve screenshots (two states × two themes × three widths) inspected in docs/reviews/TICKET-036. Keyboard, axe, overflow, reduced motion, CLS=0 and >=44px return links pass.
- Final `AGENT_OWNER=divine RUN_INVITATION_DB_TESTS=1 RUN_INVITATION_ROUTE_TESTS=1 pnpm t:pr TICKET-036` exited 0: 301 unit/database tests, build and 182 browser passes; 18 conditional skips, no retries. Log .harness/t036-pr.log.
- Physical WhatsApp/iOS/Android and Lighthouse are not verified; remain TICKET-201 under the user's preview-with-separate-QA authorization. No wedding-day release claim.

## Failures corrected and runtime recovery

Initial pre-commit gate caught strict call-array indexing in a test; replaced with distinct captured-token set assertion. Initial keyboard matrix used body focus and failed; visible heading interaction plus the exact expected focused link passes. Full gate caught missing dynamic-route inventory; added /i/invalid. Its overflow check initially assumed 200; now only that intentional invalid fixture requires 404, all other routes still require 200 and every overflow assertion remains.

Colima was stopped; starting the existing instance succeeded. Initial full Supabase startup failed. Stopped only completed TICKET-023's stack through db:stop with backup=true; retry succeeded with migrations applied. A later gate passed 300 tests but one existing RLS query timed out at the unchanged five-second limit. Docker had 54 containers. Stopped only completed TICKET-034 and TICKET-195 stacks, backup=true; unchanged recovery tests passed all 301. No other stacks or data were removed and no timeouts/checks were weakened.

## Environment and next action

Managed project wedding-be0bb60d242c; database 33021, app 33030, browser 33031. Stack healthy at successful setup and database verification; no setup process remains live. Current gate process completed. Check final GitHub CI, mark draft ready, merge only after required checks pass and record done. Next ready invitation ticket was TICKET-049; TICKET-037 still depends on event settings and design review. Preserve the unrelated primary-checkout untracked TICKET-204. Recheck live queue/ownership before starting another ticket.
