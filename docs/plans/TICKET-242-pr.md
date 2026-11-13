# Ticket

Ticket: TICKET-242

# Summary

The new saved-pass check failed in the shared guest CI job because an earlier ordering fixture intentionally retains a default event-settings row. Its strict safety guard correctly refuses that row. Run the saved-pass check immediately after the guest journey, before the ordering fixture creates retained settings.

# Changes

- Move only the saved-pass step; preserve the relative order of every pre-existing step.
- Add a regression proving the saved-pass step remains after guest coverage and before ordering setup.
- Await the actual main-frame refresh navigation before testing another invitation URL; assert both private paths explicitly. The old unchanged timestamp matched the old document while its pending reload could overwrite the next navigation.
- Preserve every browser assertion, fixture ownership guard and timeout. No product logic or database deletion changes.

# Acceptance evidence

Workflow ordering, regression and the navigation race repair are complete. Actual local repaired sequence checks pass; hosted verification of the final head remains pending. The externally merged TICKET-113 PR #179 failed run 43402002867 at its offline-pass settings guard; this repair does not rewrite that failure or certify completion.

# Verification

- CI-parity regression reproduced1 failed / 2 passed before repair; all 3 pass afterward.
- Actual isolated guest mobile/desktop journeys pass (13.0s suite).
- Following mobile offline-pass case passes in 22.8s. Desktop exceeded the unchanged 30s overall budget, once near final reconnect and again in theme switching during six concurrent TypeScript jobs. Traces remain in TICKET-113 test-results. No assertion mismatch or guard failure occurred in those local reruns; this is not claimed as a desktop pass.
- Existing production build was reused for fixture-sequence verification; no new product code is involved.
- First repaired hosted run 43406763393 passed the settings guard and mobile offline test, then reproduced a desktop refresh-navigation race twice. Trace snapshots showed the first invitation remained current after the second URL navigation. The synchronization fix awaits the actual refresh navigation and checks both paths; it does not alter worker selection or privacy assertions.
- After synchronizing refresh, both unchanged-budget offline projects pass: mobile 14.8s, desktop 13.7s, 30.5s total. Tests use TICKET-242’s own fresh local database and the existing integrated develop 21722cb9 production build, sharing ephemeral signing keys. All theme, keyboard, QR-signature, cross-invitation isolation and reconnect-revocation assertions remain.
- Fresh hosted CI is the remaining gate before merge.

# Risks and rollback

The fixture sequence is deliberate: ordering retains default settings, while the private-pass fixture refuses unknown settings. Reverting restores the known CI failure. This change neither resets shared databases nor loosens fixture authorization.

# Screenshots and UI checklist

No UI change. Existing all-theme saved-pass captures/assertions remain unchanged.

# Harness changes

CI step ordering only, with an executable regression. No existing check is removed, skipped or weakened.
