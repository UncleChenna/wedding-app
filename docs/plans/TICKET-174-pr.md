# Ticket

TICKET-174 — follow-up verification repair for merged PR #151.

# Summary

The scan-log route added an eighth admin navigation link, but the existing keyboard
smoke test still expected seven. Update the expected order to include “Scan log”
between Staff and Settings. All existing focus, tab order, sign-out visibility and
protected-route redirect assertions remain intact.

# Changes

- Add the new section to the existing browser assertion; no product behavior changes.
- Integrate develop `3b6c04e71413fe51c884238c013135fb0231f1f0`, including the merged
  scanner cache and kitchen/bar boards, before verification.

# Acceptance criteria and evidence

Original scan-log acceptance evidence remains in merged PR #151: filtering all five
verdicts/unknown invitations, separate timestamps and immutable resolution notes,
admin authorization, seven SQL checks and authenticated mobile/desktop journeys.
This follow-up repairs the remaining full-verification failure; completion remains
pending until all required checks on this PR pass.

# Verification

- Original CI failure: run42733427526, admin-shell keyboard case failed in both
  projects because actual links included Scan log and expected links did not.
- Integrated production build: PASS (`/tmp/TICKET-174-followup-build.log`).
- Exact failing browser case: **2/2 PASS**, mobile and desktop, 3.1 seconds
  (`/tmp/TICKET-174-navigation-followup.log`).
- Independent review: one-line assertion update matches navigation and preserves
  all keyboard/focus/redirect checks.
- Normal hooks and final full CI remain required before merge/CLI completion.

# Risks and rollout

Test-only repair, with no new dependencies, migrations, runtime configuration or
production data changes. Original PR151 was merged with a failing verification
job; this follow-up records and resolves that gap rather than treating it as green.
The merged scanner snapshot still requires its separate decoder follow-up verification.

# Screenshots and UI checklist

N/A for this test-only change. Original scan-log images and all-theme axe/tap-target
checks remain in PR151's authenticated browser evidence. No physical-device pass is
claimed, and existing release QA requirements remain unchanged.

# Harness changes

No hooks, timeouts, checks or assertions removed. The expected navigation list grows
to cover the newly implemented section.
