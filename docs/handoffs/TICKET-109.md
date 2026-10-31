# TICKET-109 handoff — 2026-10-31

Owner: divine. Agent: codex. Branch: TICKET-109.
Base: c9edef6cb137a194f9c215fc5b61b08488a54aa0.
Worktree: .worktrees/TICKET-109. Supabase project wedding-859a59d12fde; app 24050, browser 24051.

## State

Claimed and in_progress; start commit 8350fe7 pushed. Implementation is present but review is incomplete. No permission to merge this PR has been granted by the latest four-PR exception.

## Changes

Controller in shared/lib/install-prompt.ts; root capture and shared UI in shared/components/install-prompt.tsx. Mounted in root layout, staff layout, conditional InvitationLetter pass section and theme showcase. Eight unit tests and six browser cases. Dated plan and draft PR description are in docs/plans.

## Verified

Initial controller tests failed for missing implementation. All eight now pass. Quick gate and production build pass. Six Playwright cases pass on mobile/desktop. Database status reports the isolated 24041 database.

## Running verification

Full gate launched as exec session 90373; log artifacts/TICKET-109/verify.log. Poll the exact handle before starting another gate. No full pass is claimed yet.

## Remaining

Inspect full-gate result; fix actual failures without weakening assertions. Add all-theme screenshots at three widths, inspect every image, keyboard/reduced-motion and contrast/CLS checks, and required performance evidence. Real-device installation and WhatsApp remain unverified. Preserve TICKET-104's independent blocked work and pending permission to carry unchanged209 definition; do not alter it from this branch.

## Sources and decisions

Read installed Next server/client component guide. Browser event reference: https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeinstallprompt_event . Browser eligibility is retained by a root listener; only pass/staff UI offers installation. A reserved control row avoids a late-event layout shift. Copy is provisional warm utility copy. No offline availability claim.

## Next action

Poll session 90373 and read verify.log. Then finish visual review, update this handoff and PR description with actual results, commit/push and open a draft PR while required checks remain outstanding.
