# Ticket

Ticket: TICKET-242

# Summary

The new saved-pass check failed in the shared guest CI job because an earlier ordering fixture intentionally retains a default event-settings row. Its strict safety guard correctly refuses that row. Run the saved-pass check immediately after the guest journey, before the ordering fixture creates retained settings.

# Changes

- Move only the saved-pass step; preserve the relative order of every pre-existing step.
- Add a regression proving the saved-pass step remains after guest coverage and before ordering setup.
- Preserve every browser assertion, fixture ownership guard and timeout. No product logic or database deletion changes.

# Acceptance evidence

Workflow ordering and regression are complete. Actual hosted sequence verification remains pending. The externally merged TICKET-113 PR179 failed run43402002867 at its offline-pass settings guard; this repair does not rewrite that failure or certify completion.

# Verification

- CI-parity regression reproduced1failed/2passed before repair; all3pass afterward.
- Actual isolated guest mobile/desktop journeys pass (13.0s suite).
- Following mobile offline-pass case passes22.8s. Desktop exceeded the unchanged30s overall budget, once near final reconnect and again in theme switching during six concurrent TypeScript jobs. Traces remain in TICKET-113 test-results. No assertion mismatch or guard failure occurred in those local reruns; this is not claimed as a desktop pass.
- Existing production build was reused for fixture-sequence verification; no new product code is involved.
- Fresh hosted CI is the remaining gate. Keep this PR draft until its sequence passes.

# Risks and rollback

The fixture sequence is deliberate: ordering retains default settings, while the private-pass fixture refuses unknown settings. Reverting restores the known CI failure. This change neither resets shared databases nor loosens fixture authorization.

# Screenshots and UI checklist

No UI change. Existing all-theme saved-pass captures/assertions remain unchanged.

# Harness changes

CI step ordering only, with an executable regression. No existing check is removed, skipped or weakened.
